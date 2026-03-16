import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.hubs.models import Hub, HubSKUMapping
from apps.products.models import Product
from apps.inventory.models import Inventory

def sync_inventory():
    print("Starting Inventory Synchronization...")
    
    # Track pairs already added to avoid duplicates if mapping exists in multiple places
    added_pairs = set()

    def create_inventory_record(hub, product):
        pair = (hub.id, product.id)
        if pair in added_pairs:
            return
            
        inventory, created = Inventory.objects.get_or_create(
            hub=hub,
            product=product,
            defaults={
                'quantity_available': random.randint(5, 100),
                'quantity_reserved': random.randint(0, 5)
            }
        )
        
        if created:
            print(f"Created inventory for {hub.name} -> {product.sku}")
        else:
            print(f"Inventory already exists for {hub.name} -> {product.sku}")
        
        added_pairs.add(pair)

    # 1. Sync from HubSKUMapping
    print("\nSyncing from HubSKUMapping...")
    mappings = HubSKUMapping.objects.all().select_related('hub', 'product')
    for mapping in mappings:
        if mapping.product:
            create_inventory_record(mapping.hub, mapping.product)

    # 2. Sync from Hub.supported_skus
    print("\nSyncing from Hub.supported_skus...")
    hubs = Hub.objects.all()
    products_by_sku = {p.sku: p for p in Product.objects.all()}
    
    for hub in hubs:
        if hub.supported_skus:
            skus = [s.strip() for s in hub.supported_skus.split(',') if s.strip()]
            for sku_code in skus:
                product = products_by_sku.get(sku_code)
                if product:
                    create_inventory_record(hub, product)
                else:
                    print(f"Warning: SKU {sku_code} found in hub {hub.name} but not in Product table.")

    print("\nInventory Synchronization Complete.")

if __name__ == "__main__":
    sync_inventory()
