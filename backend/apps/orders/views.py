import pandas as pd
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.core.mail import send_mail
from .models import Order, OrderStatusHistory
from .serializers import OrderSerializer, OrderCreateSerializer, OrderStatusHistorySerializer
from .filters import OrderFilter
from apps.products.models import Product
from django_filters.rest_framework import DjangoFilterBackend

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().prefetch_related('status_history', 'product', 'hub')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = OrderFilter

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            order = serializer.save()
            # Create initial status history
            OrderStatusHistory.objects.create(
                order=order,
                status='ORDERED',
                notes="Order created manually.",
                changed_by=self.request.user if not self.request.user.is_anonymous else None
            )

    @action(detail=False, methods=['post'], url_path='upload-excel')
    def upload_excel(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file.name.endswith('.csv'):
                df = pd.read_csv(file)
            elif file.name.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file)
            else:
                return Response({"error": "Unsupported file format. Please upload Excel or CSV."}, status=status.HTTP_400_BAD_REQUEST)

            # Standardize columns (lowercase and strip)
            df.columns = [c.lower().strip().replace(' ', '_') for c in df.columns]

            # Required base logic: SKU and Quantity
            if 'sku' not in df.columns:
                return Response({"error": "Missing 'sku' column."}, status=status.HTTP_400_BAD_REQUEST)
            if 'quantity' not in df.columns:
                return Response({"error": "Missing 'quantity' column."}, status=status.HTTP_400_BAD_REQUEST)

            created_orders = []
            errors = []

            with transaction.atomic():
                for index, row in df.iterrows():
                    try:
                        sku = str(row['sku']).strip()
                        product = Product.objects.filter(sku=sku).first()
                        if not product:
                            product = Product.objects.filter(product_id=sku).first()
                        
                        if not product:
                            errors.append(f"Row {index + 2}: Product with SKU {sku} not found.")
                            continue

                        # Handle Customer Name (Flexible)
                        customer_name = ""
                        if 'customer_name' in df.columns:
                            customer_name = str(row['customer_name']).strip()
                        elif 'customer_first_name' in df.columns and 'customer_last_name' in df.columns:
                            customer_name = f"{str(row['customer_first_name']).strip()} {str(row['customer_last_name']).strip()}".strip()
                        elif 'customer_first_name' in df.columns:
                            customer_name = str(row['customer_first_name']).strip()

                        # Priority
                        priority = str(row.get('priority', 'NORMAL')).upper()
                        if priority not in ['NORMAL', 'HIGH']:
                            priority = 'NORMAL'

                        # Date Handling
                        exp_delivery = row.get('expected_delivery_date')
                        if pd.isna(exp_delivery):
                             # Default to 7 days from now if missing
                            from datetime import timedelta
                            from django.utils import timezone
                            exp_delivery = timezone.now().date() + timedelta(days=7)

                        order_data = {
                            'product': product,
                            'sku': sku,
                            'quantity': int(row['quantity']),
                            'customer_name': customer_name or "Unknown Customer",
                            'customer_phone': str(row.get('customer_phone', '')).strip(),
                            'shipping_address': str(row.get('shipping_address', 'No Address Provided')).strip(),
                            'priority': priority,
                            'expected_delivery_date': exp_delivery
                        }

                        order = Order.objects.create(**order_data)
                        
                        # Create initial status history
                        OrderStatusHistory.objects.create(
                            order=order,
                            status='ORDERED',
                            notes="Order created via Excel import.",
                            changed_by=request.user if not request.user.is_anonymous else None
                        )
                        created_orders.append(order.order_id)

                    except Exception as e:
                        errors.append(f"Row {index + 2}: {str(e)}")

            if errors and not created_orders:
                 return Response({"error": "Failed to import rows", "details": errors}, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                "message": f"Successfully processed {len(df)} rows.",
                "created_count": len(created_orders),
                "order_ids": created_orders,
                "errors": errors
            }, status=status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS)

        except Exception as e:
            return Response({"error": f"Failed to process file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')

        valid_statuses = [s[0] for s in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            order.status = new_status
            
            from django.utils import timezone
            now = timezone.now()
            
            if new_status == 'MANUFACTURING':
                order.manufacturing_started_at = now
            elif new_status == 'QUALITY_TEST':
                order.qa_started_at = now
            elif new_status == 'COMPLETED_MANUFACTURING':
                order.completed_manufacturing_at = now
            elif new_status == 'DESPATCHED_TO_WAREHOUSE':
                order.warehouse_despatched_at = now
            elif new_status == 'DESPATCHED_TO_CUSTOMER':
                order.customer_despatched_at = now
            elif new_status == 'COMPLETED':
                order.completed_at = now
            elif new_status == 'DELAYED':
                order.delay_reason = request.data.get('delay_reason', notes)
                
            order.save()

            OrderStatusHistory.objects.create(
                order=order,
                status=new_status,
                notes=notes,
                changed_by=request.user if not request.user.is_anonymous else None
            )
            
            # Send Notification to Admins
            from apps.users.models import User
            from apps.notifications.models import Notification
            
            admins = User.objects.filter(role='ADMIN')
            
            notification_type = 'INFO'
            if new_status == 'DELAYED':
                notification_type = 'WARNING'
                msg = f"⚠ Order {order.order_id} delayed: {order.delay_reason}"
            elif new_status == 'COMPLETED':
                notification_type = 'SUCCESS'
                msg = f"Order {order.order_id} has been fully completed."
            elif new_status == 'MANUFACTURING':
                hub_name = order.hub.name if order.hub else "Hub"
                msg = f"🔔 Order {order.order_id} manufacturing started at {hub_name}"
            elif new_status == 'QUALITY_TEST':
                msg = f"🔔 Order {order.order_id} entered Quality Testing"
            elif new_status == 'COMPLETED_MANUFACTURING':
                msg = f"🔔 Manufacturing completed for Order {order.order_id}"
            elif new_status == 'DESPATCHED_TO_WAREHOUSE':
                msg = f"📦 Order {order.order_id} dispatched to warehouse"
            elif new_status == 'DESPATCHED_TO_CUSTOMER':
                msg = f"🚚 Order {order.order_id} dispatched to customer"
            else:
                msg = f"Order {order.order_id} moved to {new_status.replace('_', ' ')}"
                
            notifications = [
                Notification(
                    user=admin,
                    title="Production Update",
                    message=msg,
                    type=notification_type
                ) for admin in admins
            ]
            Notification.objects.bulk_create(notifications)

        return Response(OrderSerializer(order).data)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        from django.db.models import Count
        from django.utils import timezone
        
        stats = Order.objects.values('status').annotate(count=Count('id'))
        total = Order.objects.count()
        unassigned = Order.objects.filter(hub__isnull=True).count()
        delayed = Order.objects.filter(expected_delivery_date__lt=timezone.now().date()).exclude(status='COMPLETED').count()
        
        return Response({
            "total_orders": total,
            "unassigned_orders": unassigned,
            "delayed_orders": delayed,
            "stats": {item['status']: item['count'] for item in stats}
        })

    @action(detail=True, methods=['post'], url_path='assign-hub')
    def assign_hub(self, request, pk=None):
        order = self.get_object()
        hub_id = request.data.get('hub_id')
        
        if not hub_id:
            return Response({"error": "hub_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        from apps.hubs.models import Hub
        hub = Hub.objects.filter(pk=hub_id).first()
        if not hub:
            return Response({"error": "Hub not found"}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            order.hub = hub
            order.status = 'ASSIGNED'
            order.save()

            OrderStatusHistory.objects.create(
                order=order,
                status='ASSIGNED',
                notes=f"Order assigned to {hub.name} by {request.user.email}",
                changed_by=request.user
            )
            
            # Simple audit log integration (assuming apps.users.models.AuditLog is available)
            try:
                from apps.users.models import AuditLog
                from django.utils import timezone
                AuditLog.objects.create(
                    user=request.user,
                    action=f"ASSIG_ORDER",
                    module="ORDERS",
                    new_value=f"Order {order.order_id} assigned to Hub {hub.name}",
                    timestamp=timezone.now()
                )
            except ImportError:
                pass

        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'], url_path='send-email')
    def send_email(self, request, pk=None):
        order = self.get_object()
        subject = request.data.get('subject')
        message = request.data.get('message')

        if not subject or not message:
            return Response({"error": "Subject and message are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not order.customer_email:
            return Response({"error": "Order has no customer email address"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from django.template.loader import render_to_string
            from django.utils.html import strip_tags
            
            # Formatting variables for the template
            status_displays = dict(Order.STATUS_CHOICES)
            status_text = status_displays.get(order.status, order.status)
            
            # Simple progress calc
            statuses = [s[0] for s in Order.STATUS_CHOICES]
            try:
                progress_percentage = min(100, int((statuses.index(order.status) + 1) / len(statuses) * 100))
            except ValueError:
                progress_percentage = 50
                
            from django.utils.dateformat import DateFormat
            formatted_expected_date = DateFormat(order.expected_delivery_date).format('d F, Y') if order.expected_delivery_date else "TBD"
            formatted_order_date = DateFormat(order.created_at).format('d M Y') if order.created_at else DateFormat(timezone.now()).format('d M Y')

            # Determine steps for the horizontal tracker
            # Step 1: Ordered
            # Step 2: Ready to ship (Dispatched from factory or at warehouse)
            # Step 3: Delivered
            step_1_done = order.status != 'CANCELLED'
            step_2_done = order.status in ['DESPATCHED_TO_WAREHOUSE', 'WAREHOUSE_RECEIVED', 'DESPATCHED_TO_CUSTOMER', 'COMPLETED']
            step_3_done = order.status == 'COMPLETED'
            
            # Map statuses to dates if possible (simplified for now)
            step_1_date = formatted_order_date
            step_2_date = DateFormat(order.completed_manufacturing_at).format('d M') if order.completed_manufacturing_at else ""
            step_3_range = "Dec 18 - 19" # Placeholder or derived from expected_delivery_date
            if order.expected_delivery_date:
                step_3_range = DateFormat(order.expected_delivery_date).format('d M')

            # Calculate financial totals based on product price and quantity
            price_per_unit = float(order.product.price) if order.product else 0.0
            quantity = int(order.quantity) if order.quantity else 1
            
            subtotal = price_per_unit * quantity
            shipping = 2.00 if subtotal > 0 else 0.00
            tax = subtotal * 0.05 # Assuming 5% tax rate
            order_total = subtotal + shipping + tax
            
            from django.utils import timezone
            current_date = timezone.now().strftime('%d %b %Y')

            context = {
                'customer_name': order.customer_name,
                'order_id': order.order_id,
                'status_text': status_text,
                'custom_message': message,
                'progress_percentage': progress_percentage,
                'product_name': order.product.name if order.product else "Product",
                'product_price': f"{price_per_unit:.2f}",
                'quantity': quantity,
                'expected_delivery': formatted_expected_date,
                'order_date': formatted_order_date,
                'subtotal': f"{subtotal:.2f}",
                'shipping': f"{shipping:.2f}",
                'tax': f"{tax:.2f}",
                'order_total': f"{order_total:.2f}",
                'current_date': current_date,
                'shipping_address': order.shipping_address,
                'customer_phone': order.customer_phone,
                'customer_email': order.customer_email,
                'step_1_done': step_1_done,
                'step_2_done': step_2_done,
                'step_3_done': step_3_done,
                'step_1_date': step_1_date,
                'step_2_date': step_2_date,
                'step_3_range': step_3_range
            }

            html_message = render_to_string('orders/update_email.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject=subject,
                message=plain_message,
                from_email='angeljoseph2026@mca.ajce.in', # Using SMTP sender
                recipient_list=[order.customer_email],
                html_message=html_message,
                fail_silently=False,
            )
            
            # Log this as an order status history note so others know an email was sent
            OrderStatusHistory.objects.create(
                order=order,
                status=order.status,
                notes=f"Email sent to customer ({order.customer_email}). Subject: {subject}",
                changed_by=request.user if not request.user.is_anonymous else None
            )
            
            return Response({"message": "Email sent successfully"})
        except Exception as e:
            return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='activity-log')
    def activity_log(self, request):
        history = OrderStatusHistory.objects.select_related('order', 'order__product', 'changed_by').order_by('-created_at')[:100]
        serializer = OrderStatusHistorySerializer(history, many=True)
        return Response(serializer.data)
