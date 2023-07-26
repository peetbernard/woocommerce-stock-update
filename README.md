# woocommerce-stock-update
Automatic stock and price update between stock management program LKR and Woocomemrce webshop.

The async function stockPosting() is responsible for comparing and synchronizing inventory between the WooCommerce webshop and the Laurel inventory management.
The function performs the following steps:

First, it retrieves the products from the WooCommerce webshop and the corresponding inventory data from Laurel using getWebshopSingleAndVari(), getWebshopVars() and getLaurel().

To prepare for comparison, it creates the sumLaurel array, which sums up the Laurel inventory for unique item codes. It also creates a check array to keep track of processed item codes.

Using the woo and sumLaurel arrays for comparison, the function determines which products have different inventory levels between WooCommerce and Laurel. The data of these products is stored in the final array, containing item codes, IDs, woocommerce types, parent IDs, and the synchronized inventory.

Based on the required operations, the function sends HTTP requests to the WooCommerce API to update the inventory in the webshop according to the data from the Laurel program.

It uses await fetch(...) to wait for the completion of the HTTP requests, ensuring full data retrieval and processing before continuing.

Finally, it creates a uniqueFinal array that removes duplicates of items with the same item code.

The async function stockPosting() effectively synchronizes inventory between the WooCommerce webshop and the Laurel warehouse, updating stock levels based on discrepancies. This ensures that both locations have accurate and up-to-date information about product inventory.

It's important to note that this code runs on the server-side and would not function correctly on the frontend due to its limitations. The well-written and efficient code performs various HTTP requests to update inventory, and it provides information about the executed operations on the console.

Overall, with the async function stockPosting(), the webshop inventory can be kept up-to-date and in sync with the warehouses, facilitating order management and customer satisfaction.
