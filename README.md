# Folia — Customer.io Test Store

A realistic e-commerce plant store built for testing Customer.io integrations. Single-file, no build step, deploys to Vercel in under a minute.

## Deploy to Vercel

1. Push this folder to a GitHub repo (or drag-drop to Vercel)
2. In Vercel, set the **Output Directory** to `.` (root)
3. No build command needed — it's a static HTML file
4. Deploy

## Connecting Customer.io

Once deployed, enter your **Site ID** in the black banner at the top of the page and click **Connect**. The snippet loads dynamically — no code changes needed.

To find your Site ID: Customer.io → Settings → API Credentials → Site ID

## Events fired

| Event | Trigger |
|---|---|
| `page_viewed` | Every page navigation |
| `product_viewed` | Opening a product detail page |
| `product_added_to_cart` | Clicking "Add to cart" |
| `product_removed_from_cart` | Removing from cart |
| `cart_abandoned` | 30 seconds of inactivity with items in cart |
| `order_completed` | Completing checkout |
| `user_signed_up` | Creating an account via modal |
| `user_logged_in` | Signing in via modal |
| `plant_saved` | Saving/hearting a plant (creates Object relationship) |
| `plant_unsaved` | Removing from saved |
| `in_app_message_shown` | IAB appears (cart page + post-purchase) |
| `in_app_message_dismissed` | Closing the IAB |
| `care_reminders_enabled` | Tapping IAB action post-purchase |

## Customer.io Objects

Saved plants use the **Objects** API. Each plant is an object with:
- `object_type_id: '1'`
- `object_id`: plant slug (e.g. `monstera-thai`)
- Attributes: `name`, `genus`, `price`, `care_level`, `collection`

When a logged-in user saves a plant, a relationship is created between that person and the plant object. Unsaving removes the relationship.

## In-app messages

Two IAB triggers are built in:

1. **Cart page** — shows after 1.5s if the cart has items
2. **Post-purchase** — shows 2s after order confirmation

These use the simulated IAB widget. To test real Customer.io in-app messages, make sure `data-use-in-app="true"` is set on the tracker (it is by default in this store) and set up an in-app campaign in Customer.io targeting `page_viewed` on the Cart or Confirmation page.

## Local development

Just open `index.html` in a browser. No server needed.
