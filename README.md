# Folia — Customer.io Demo Store

A realistic e-commerce plant store for demoing Customer.io features. Single HTML file, no build step, deploys to Vercel instantly.

---

## Setup

**Deploy to Vercel**

1. Push this repo to GitHub
2. Go to vercel.com → Add New Project → import the repo
3. Leave all settings as default → Deploy

**Connect Customer.io**

The store defaults to the CX Demo workspace automatically. To use a different workspace, click **Switch workspace** in the top banner and paste your Analytics.js write key. Find it in Customer.io → Data Pipelines → Sources → your JS source → Settings → API Key.

To reset back to CX Demo, click **Switch workspace → Reset to default**.

---

## Events

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

**Key event properties**

`order_completed` — `order_id`, `revenue`, `currency`, `item_count`, `item_names`, `items[]`

`product_viewed` / `product_added_to_cart` — `product_id`, `product_name`, `product_price`, `collection`, `care_level`

**Note:** Since this uses Analytics.js via Data Pipelines, event properties in Journeys Liquid are accessed as `{{ event.properties.revenue }}` not `{{ event.revenue }}`.

---

## Identify

Users are identified on signup, login, and checkout with: `id`, `email`, `name`, `first_name`, `last_name`, `created_at`

Additional attributes are set via the **My profile** page: `address`, `city`, `postcode`, `country`

---

## Object relationships

When a signed-in user saves a plant (hearts it), the store calls `cioanalytics.identify` with `cio_relationships` to create a relationship between the person and the Plant object (object type 1). Unsaving removes the relationship.

Plant objects must exist in the workspace before relationships can be created. Use the provided `plants.csv` to import them via Data & Integrations → Objects → Plants → Import.

---

## In-app messages

All in-app messages come from Customer.io campaigns — nothing is hardcoded. Use page rules to target pages:

| Page | URL contains |
|---|---|
| Home | `/` |
| Shop | `shop` |
| Cart | `cart` |
| Product detail | `product` |
| Wishlist | `wishlist` |
| Order confirmation | `confirmation` |
| Profile | `profile` |

Anonymous in-app is enabled so messages show before a user identifies.

---

## Admin panel

Access at `/#admin`. Default PIN: `1234`.

- **Products** — edit name, price, description, care level, badge
- **Events** — rename events or disable them
- **Settings** — store name, headline, cart abandonment timer, PIN

Changes save to localStorage and apply instantly.

---

## Workspace switcher

Each browser session holds its own write key in localStorage. Multiple people can use the store simultaneously with different workspaces without interfering with each other.
