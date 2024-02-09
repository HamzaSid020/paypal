const Order = require("./Order");

const OrderState = Object.freeze({
  WELCOMING: Symbol("welcoming"),
  SHOES_TYPE: Symbol("shoes_type"),
  SIZE: Symbol("size"),
  ATTRIBUTE: Symbol("attribute"),
  SHOE_LACE: Symbol("shoe_lace"),
  PAYMENT: Symbol("payment"),
});

module.exports = class ShoesOrder extends Order {
  constructor(sNumber, sUrl) {
    super(sNumber, sUrl);
    this.stateCur = OrderState.WELCOMING;
    this.sShoesType = "";
    this.sSize = "";
    this.sAttribute = "";
    this.sShoeLace = "";
    this.sItem = "shoes";
    this.estimatedPrice = 0;
  }
  handleInput(sInput) {
    let aReturn = [];

    try {
      switch (this.stateCur) {
        case OrderState.WELCOMING:
          this.stateCur = OrderState.SHOES_TYPE;
          aReturn.push("Welcome to the Shoe World!");
          aReturn.push("What type of shoes would you like? We have Sneakers and Boots.");
          break;

        case OrderState.SHOES_TYPE:
          if (!["sneakers", "boots"].includes(sInput.toLowerCase())) {
            throw new Error("Invalid shoes type. Please choose Sneakers or Boots.");
          }
          // Move to the next state, save the selected shoe type, and ask about the size
          this.stateCur = OrderState.SIZE;
          this.sShoesType = sInput;
          aReturn.push(`Great choice! What size ${this.sShoesType} would you like?`);
          break;

        case OrderState.SIZE:
          // Add additional size validation as needed
          if (!/^[0-9]+$/.test(sInput)) {
            throw new Error("Invalid size. Please enter a numeric size.");
          }
          this.stateCur = OrderState.ATTRIBUTE;
          this.sSize = sInput;
          aReturn.push(`Excellent! Choose a color for your ${this.sSize} ${this.sShoesType}.`);
          break;

        case OrderState.ATTRIBUTE:
          // Move to the next state, save the selected color, and ask about additional attributes
          this.stateCur = OrderState.SHOE_LACE;
          this.sAttribute = sInput;
          aReturn.push(`Would you like additional Shoe Lace? (yes/no)`);
          break;

        case OrderState.SHOE_LACE:
          // Add additional validation if needed
          if (!["yes", "no"].includes(sInput.toLowerCase())) {
            throw new Error("Invalid input. Please enter either 'Yes' or 'No'.");
          }

          this.stateCur = OrderState.PAYMENT;
          this.estimatedPrice = this.calculateEstimatedPrice(sInput);
          aReturn.push("Thank you for your order of");
          aReturn.push(`size ${this.sSize} ${this.sAttribute} ${this.sItem} in ${this.sShoesType} `);
          this.sShoeLace = sInput.toLowerCase() === "yes" ? "Yes" : "No";

          // Display the estimated price
          aReturn.push(`Estimated Price: $${this.estimatedPrice.toFixed(2)}`);
          aReturn.push(`Please pay for your order here`);
          aReturn.push(`${this.sUrl}/payment/${this.sNumber}/`);
          break;

        case OrderState.PAYMENT:
          console.log(sInput);
          // Validate the structure of the PayPal payment details
          if (!sInput.purchase_units || !Array.isArray(sInput.purchase_units) || sInput.purchase_units.length === 0) {
            throw new Error("Invalid PayPal payment details.");
          }

          const shippingAddress = sInput.purchase_units[0].shipping;

          // Validate the structure of the shipping address
          if (!shippingAddress || !shippingAddress.name || !shippingAddress.address) {
            throw new Error("Invalid shipping address details.");
          }

          // Access individual elements of the shipping address
          const recipientName = shippingAddress.name.full_name;
          const addressLine1 = shippingAddress.address.address_line_1;
          const addressLine2 = shippingAddress.address.address_line_2;
          const city = shippingAddress.address.admin_area_2;
          const state = shippingAddress.address.admin_area_1;
          const postalCode = shippingAddress.address.postal_code;
          const country = shippingAddress.address.country_code;

          this.isDone(true);
          let d = new Date();
          d.setMinutes(d.getMinutes() + 20);
          aReturn.push(
            `Your order will be delivered to \n` +
            `${recipientName}\n at` +
            ` "${addressLine1}, ${addressLine2}, ${city}, ${state}, ${postalCode}, ${country}" at ${d.toTimeString()}`
          );
          // Ask the user if they want to make a new purchase
          this.stateCur = OrderState.WELCOME;
          aReturn.push("Thank you for your order!");
          aReturn.push("Enter yes to restart");
          break;         
      }
    } catch (error) {
      // Handle errors by pushing an error message to the return array
      aReturn.push(`Error: ${error.message}`);
    }

    return aReturn;
  }

  calculateEstimatedPrice(sInput) {
    const basePrice = 50;
    const shoeLaceCost = 30;
    // Calculate and return the estimated price
    return basePrice + (sInput.toLowerCase() !== "no" ? shoeLaceCost : 0);
  }

  renderForm(sTitle = "-1", sAmount = "-1") {
    // your client id should be kept private
    if (sTitle != "-1") {
      this.sItem = sTitle;
    }
    if (sAmount != "-1") {
      this.nOrder = sAmount;
    }
    const sClientID = process.env.SB_CLIENT_ID || 'ARYVO-KBjOJSaV5h3KIdXjy9zAp3EwTMVvReVzWNyNbo_YLg_y6XQu0W4vjnyXH0DwUg2thotkFK2u90'
    return (`
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }

        /* Container Styles */
        .container {
            background-color: #fff; /* Matching colored box */
            border: 2px solid #ddd; /* Border color */
            border-radius: 10px; /* Border radius for a rounded look */
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.2); /* Box shadow for depth */
            max-width: 600px; /* Adjust the max-width as needed */
            width: 90%;
        }

        main {
            padding: 20px;
            text-align: center;
        }

        h2 {
            color: #333;
            margin-bottom: 20px;
        }

        p {
            color: #555;
            margin: 10px 0;
        }

        /* PayPal Button Container */
        #paypal-button-container {
            margin-top: 20px;
        }

        /* PayPal Smart Payment Buttons Styles */
        .paypal-buttons {
            display: flex;
            justify-content: center;
        }

        /* Optional: Customize Smart Payment Buttons appearance */
        .paypal-button {
            height: 40px;
        }

        /* Checkout Info Styles */
        .checkout-info {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .line-by-line {
            margin: 15px 0;
            text-align: left;
        }

        .line-by-line p {
            color: #555;
            font-size: 1.2em;
            margin: 5px 0;
        }
    </style>
    </head>
    <body>
        <div class="container">
            <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
            <script src="https://www.paypal.com/sdk/js?client-id=${sClientID}"></script>
            <main>
        <div class="checkout-info">
            <h2>Order Confirmation</h2>
            <div class="line-by-line">
                <p><strong>Order Number:</strong> ${this.sNumber}</p>
                <p><strong>Item:</strong> ${this.sShoesType}</p>
                <p><strong>Size:</strong> ${this.sSize}</p>
                <p><strong>Color:</strong> ${this.sAttribute}</p>
                <p><strong>Additional Lace:</strong> ${this.sShoeLace}</p>
                <p><strong>Total Amount:</strong> $${this.estimatedPrice.toFixed(2)}</p>
            </div>
            <p>Complete your purchase here:</p>
        </div>
        <div id="paypal-button-container"></div>
  
<script>
          paypal.Buttons({  
              createOrder: function(data, actions) {
                // This function sets up the details of the transaction, including the amount and line item details.
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: '${this.estimatedPrice.toFixed(2)}'
                    }
                  }]
                });
              },
              onApprove: function(data, actions) {
                // This function captures the funds from the transaction.
                return actions.order.capture().then(function(details) {
                  // This function shows a transaction success message to your buyer.
                  $.post(".", details, ()=>{
                    window.open("", "_self");
                    window.close(); 
                  });

                });
              }
          
            }).render('#paypal-button-container');
          // This function displays Smart Payment Buttons on your web page.
        </script>
        </main>
      </body>
          
      `);

  }
}