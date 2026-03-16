import os
import django
import uuid
from datetime import date, timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.hubs.models import Hub, HubSKUMapping
from apps.products.models import Product
from apps.orders.models import Order, OrderItem
from apps.inventory.models import Inventory
from apps.ai_engine.models import AIDecision
from apps.ai_engine.services.assignment_agent import AssignmentAgent

def verify_assignment():
    print("--- Starting AI Assignment Agent Verification ---")

    # 1. Setup Test Data
    hub_name = f"Test Hub {uuid.uuid4().hex[:6]}"
    hub = Hub.objects.create(
        hub_code=f"HUB-{uuid.uuid4().hex[:4]}",
        name=hub_name,
        location="Bangalore",
        max_daily_capacity=100,
        current_load=10,
        status='ACTIVE'
    )
    print(f"Created Hub: {hub.name}")

    product = Product.objects.create(
        product_id=f"PROD-{uuid.uuid4().hex[:4]}",
        name=f"Test Product {uuid.uuid4().hex[:6]}",
        sku=f"SKU-{uuid.uuid4().hex[:4]}",
        price=100.00,
        category="Test Category"
    )
    print(f"Created Product: {product.name} (SKU: {product.sku})")

    HubSKUMapping.objects.create(
        hub=hub,
        product=product,
        priority=10,
        is_enabled=True
    )
    print("Created Hub SKU Mapping")

    Inventory.objects.create(
        hub=hub,
        product=product,
        quantity_available=50,
        quantity_reserved=0
    )
    print("Created Inventory")

    order = Order.objects.create(
        customer_name="Test Customer",
        customer_phone="1234567890",
        shipping_address="Electronic City, Bangalore",
        expected_delivery_date=date.today() + timedelta(days=5)
    )
    print(f"Created Order: {order.order_id}")

    order_item = OrderItem.objects.create(
        order=order,
        product=product,
        sku=product.sku,
        quantity=2,
        assignment_status='PENDING'
    )
    print(f"Created OrderItem for SKU: {order_item.sku}")

    # 2. Run Assignment Agent
    print("\nRunning Assignment Agent process_item...")
    AssignmentAgent.process_item(order_item)

    # 3. Verify Results
    order_item.refresh_from_db()
    decision = AIDecision.objects.filter(related_item=order_item).first()

    if not decision:
        print("FAILED: No AIDecision created.")
        return

    print(f"SUCCESS: AIDecision created (ID: {decision.id})")
    print(f"Confidence Score: {decision.confidence_score}")
    print(f"Decision Status: {decision.status}")
    print(f"Recommendation: {decision.recommendation}")

    if order_item.assigned_hub == hub:
        print(f"SUCCESS: OrderItem assigned to {hub.name}")
    else:
        print(f"FAILED: OrderItem not assigned to correct hub. Assigned to: {order_item.assigned_hub}")

    print("\n--- Verification Completed ---")

if __name__ == "__main__":
    verify_assignment()
