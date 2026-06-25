# Folia — Customer.io Test Store

A realistic e-commerce plant store for testing Customer.io integrations. Single HTML file, no build step, deploys to Vercel in under a minute.

---

## Setup

**Deploy to Vercel**

1. Push this folder to a GitHub repo
2. Go to vercel.com → Add New Project → Import the repo
3. Leave all settings as default → Deploy
4. Your store is live at `your-project.vercel.app`

**Connect Customer.io**

The store defaults to the solutions demo workspace automatically. To use a different workspace, click **Switch workspace** in the black banner and paste your Analytics.js write key. Find it in Customer.io → Data Pipelines → Sources → your JS source → Settings → API Key.

To reset back to the solutions demo, click **Switch workspace → Reset to default**.

---

## Events

Every interaction fires a real event into Customer.io:

| Event | Trigger |
|---|---|
| `page_viewed` | Every page navigation |
| `product_viewed` | Opening a product detail page |
| `product_added_to_cart` | Clicking Add to cart |
| `product_removed_from_cart` | Removing an item from cart |
| `cart_abandoned` | 30 seconds of inactivity with items in cart |
| `order_completed` | Submitting checkout |
| `user_signed_up` | Creating an account |
| `user_logged_in` | Signing in |
| `plant_saved` | Saving/hearting a plant |
| `plant_unsaved` | Removing a plant from saved |

**Event properties**

`order_completed` includes: `order_id`, `revenue`, `currency`, `item_count`, `item_names`, `items[]`

`product_viewed` and `product_added_to_cart` include: `product_id`, `product_name`, `product_price`, `collection`, `care_level`

`user_signed_up` / `user_logged_in` include: `email`, `first_name`, `last_name`

**Identify**

Users are identified on signup, login, and checkout with: `id`, `email`, `name`, `first_name`, `last_name`

---

## In-app messages

In-app messages come entirely from Customer.io campaigns — nothing is hardcoded in the store. Use page rules with `contains` to target pages:

| Page | Rule |
|---|---|
| Home | URL contains `/` |
| Shop | URL contains `shop` |
| Collections | URL contains `collections` |
| Cart | URL contains `cart` |
| Product detail | URL contains `product` |
| Wishlist | URL contains `wishlist` |
| Order confirmation | URL contains `confirmation` |

Anonymous in-app is enabled so messages can show before a user identifies.

---

## Admin panel

Access at `/#admin`. Enter the PIN set in Settings (default: change this before sharing with your team).

- **Products** — edit name, price, description, care level, badge
- **Events** — rename events or disable them entirely
- **Settings** — store name, headline, cart abandonment timer, PIN

Changes save to browser localStorage and apply instantly without a redeploy.

---

## Workspace isolation

Each person's browser holds their own write key in localStorage. Two people using the store simultaneously with different workspaces don't interfere with each other.
