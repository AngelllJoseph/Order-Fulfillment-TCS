import pandas as pd
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Product
from .serializers import ProductSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
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

            required_columns = ['product_id', 'sku', 'name', 'price', 'category']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                return Response({"error": f"Missing columns: {', '.join(missing_columns)}"}, status=status.HTTP_400_BAD_REQUEST)

            products_to_create = []
            products_to_update = []
            errors = []

            for index, row in df.iterrows():
                try:
                    product_data = {
                        'product_id': str(row['product_id']).strip(),
                        'sku': str(row['sku']).strip(),
                        'name': str(row['name']).strip(),
                        'price': float(row['price']),
                        'description': str(row.get('description', '')).strip(),
                        'category': str(row['category']).strip(),
                        'status': str(row.get('status', 'ACTIVE')).upper()
                    }

                    # Validate status
                    if product_data['status'] not in ['ACTIVE', 'INACTIVE']:
                        product_data['status'] = 'ACTIVE'

                    # Check if product exists (by product_id or sku)
                    existing_product = Product.objects.filter(product_id=product_data['product_id']).first()
                    if not existing_product:
                        existing_product = Product.objects.filter(sku=product_data['sku']).first()

                    if existing_product:
                        for key, value in product_data.items():
                            setattr(existing_product, key, value)
                        products_to_update.append(existing_product)
                    else:
                        products_to_create.append(Product(**product_data))

                except Exception as e:
                    errors.append(f"Row {index + 2}: {str(e)}")

            # Perform bulk operations
            if products_to_create:
                Product.objects.bulk_create(products_to_create)
            
            if products_to_update:
                Product.objects.bulk_update(products_to_update, ['sku', 'name', 'price', 'description', 'category', 'status'])

            return Response({
                "message": f"Successfully processed {len(df)} rows.",
                "created": len(products_to_create),
                "updated": len(products_to_update),
                "errors": errors
            }, status=status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS)

        except Exception as e:
            return Response({"error": f"Failed to process file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
