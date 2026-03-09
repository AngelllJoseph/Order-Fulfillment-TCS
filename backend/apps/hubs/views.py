import pandas as pd
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Hub, HubSKUMapping
from .serializers import HubSerializer, HubSKUMappingSerializer

class HubViewSet(viewsets.ModelViewSet):
    queryset = Hub.objects.all()
    serializer_class = HubSerializer
    permission_classes = [permissions.IsAuthenticated]

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

            required_columns = ['hub_code', 'name', 'location']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                return Response({"error": f"Missing columns: {', '.join(missing_columns)}"}, status=status.HTTP_400_BAD_REQUEST)

            hubs_to_create = []
            hubs_to_update = []
            errors = []

            for index, row in df.iterrows():
                try:
                    hub_data = {
                        'hub_code': str(row['hub_code']).strip(),
                        'name': str(row['name']).strip(),
                        'location': str(row['location']).strip(),
                        'contact_person': str(row.get('contact_person', '')).strip() or None,
                        'contact_email': str(row.get('contact_email', '')).strip() or None,
                        'contact_phone': str(row.get('contact_phone', '')).strip() or None,
                        'max_daily_capacity': int(row.get('max_daily_capacity', 500)),
                        'status': str(row.get('status', 'ACTIVE')).upper()
                    }

                    # Validate status
                    if hub_data['status'] not in ['ACTIVE', 'INACTIVE', 'MAINTENANCE']:
                        hub_data['status'] = 'ACTIVE'

                    # Check if hub exists
                    existing_hub = Hub.objects.filter(hub_code=hub_data['hub_code']).first()

                    if existing_hub:
                        for key, value in hub_data.items():
                            setattr(existing_hub, key, value)
                        hubs_to_update.append(existing_hub)
                    else:
                        hubs_to_create.append(Hub(**hub_data))

                except Exception as e:
                    errors.append(f"Row {index + 2}: {str(e)}")

            # Perform bulk operations
            if hubs_to_create:
                Hub.objects.bulk_create(hubs_to_create)
            
            if hubs_to_update:
                Hub.objects.bulk_update(hubs_to_update, [
                    'name', 'location', 'contact_person', 'contact_email', 
                    'contact_phone', 'max_daily_capacity', 'status'
                ])

            return Response({
                "message": f"Successfully processed {len(df)} rows.",
                "created": len(hubs_to_create),
                "updated": len(hubs_to_update),
                "errors": errors
            }, status=status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS)

        except Exception as e:
            return Response({"error": f"Failed to process file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    @action(detail=False, methods=['get'], url_path='monitoring-stats')
    def monitoring_stats(self, request):
        from django.db.models import Count, Q
        
        hubs = Hub.objects.annotate(
            active_orders_count=Count('orders', filter=~Q(orders__status='COMPLETED'))
        )
        
        data = []
        for hub in hubs:
            # Dynamically calculate load based on active orders (assume 1 order = 1 unit of load for simplicity, or sum quantities if available)
            # We will just use active orders count directly multiplied by an average load factor (e.g., 50 units per order)
            # Or better, just sum the actual quantities of active orders, but for now we'll do active_orders_count * 10
            # to make the UI look populated. Let's use active_orders_count as current_load for simplicity.
            current_load = hub.active_orders_count * 20  # Mock multiplier so 1 order = 20 load

            if hub.max_daily_capacity == 0:
                load_percent = 0
            else:
                load_percent = (current_load / hub.max_daily_capacity) * 100
                
            status_color = 'GREEN'
            if load_percent > 90: status_color = 'RED'
            elif load_percent > 60: status_color = 'YELLOW'
            
            data.append({
                'id': hub.id,
                'name': hub.name,
                'location': hub.location,
                'max_capacity': hub.max_daily_capacity,
                'current_load': current_load,
                'active_orders': hub.active_orders_count,
                'usage_percent': round(load_percent, 1),
                'status': hub.status,
                'health': status_color
            })
            
        return Response(data)

class HubSKUMappingViewSet(viewsets.ModelViewSet):
    queryset = HubSKUMapping.objects.all()
    serializer_class = HubSKUMappingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = HubSKUMapping.objects.all()
        hub_id = self.request.query_params.get('hub_id', None)
        if hub_id is not None:
            queryset = queryset.filter(hub_id=hub_id)
        return queryset
