import sys
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.orders.serializers import OrderCreateSerializer
from apps.products.models import Product

product = Product.objects.first()
if not product:
    print("No products found to test")
    sys.exit(1)

data = {
    "customer_name": "John Doe",
    "customer_phone": "+1 234 567 890",
    "customer_email": "",
    "shipping_address": "Test Address",
    "priority": "NORMAL",
    "expected_delivery_date": "2025-12-31",
    "items": [
        {
            "product": product.id,
            "quantity": 1
        }
    ]
}

serializer = OrderCreateSerializer(data=data)
if serializer.is_valid():
    print("Is Valid! Data:", serializer.validated_data)
else:
    print("Errors:", serializer.errors)
