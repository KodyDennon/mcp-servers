#!/usr/bin/env node
import inquirer from "inquirer";
import chalk from "chalk";
import { ConfigManager } from "../dist/config-manager.js";
import { ShopifyPlugin } from "../dist/plugins/shopify.js";
import path from "path";

const config = new ConfigManager();

function showBanner() {
  console.clear();
  console.log(
    chalk.cyan.bold("\n╔════════════════════════════════════════════╗"),
  );
  console.log(chalk.cyan.bold("║   E-commerce MCP Server Setup Wizard      ║"));
  console.log(
    chalk.cyan.bold("╚════════════════════════════════════════════╝\n"),
  );
  console.log(chalk.gray("This wizard will guide you through connecting your"));
  console.log(
    chalk.gray("e-commerce platforms. Press Ctrl+C to exit anytime.\n"),
  );
}

function getConfiguredPlatforms() {
  const configured = [];
  const current = config.getAll();

  if (current.SHOPIFY_SHOP_URL && current.SHOPIFY_ACCESS_TOKEN)
    configured.push("Shopify");
  if (current.AMAZON_SELLER_ID && current.AMAZON_ACCESS_KEY_ID)
    configured.push("Amazon");
  if (current.FEDEX_API_KEY && current.FEDEX_ACCOUNT_NUMBER)
    configured.push("FedEx");
  if (current.QUICKBOOKS_CLIENT_ID && current.QUICKBOOKS_REALM_ID)
    configured.push("QuickBooks");

  return configured;
}

function validateRequired(value) {
  return value.trim() !== "" || "This field is required";
}

function validateUrl(value) {
  if (!value.trim()) return "This field is required";
  if (value.includes("myshopify.com")) return true;
  return "Please enter a valid Shopify domain (e.g., your-shop.myshopify.com)";
}

async function setupShopify() {
  console.log(chalk.blue("\n📦 Shopify Setup\n"));
  console.log(chalk.gray("You'll need:"));
  console.log(
    chalk.gray("  1. Your Shopify store URL (e.g., your-shop.myshopify.com)"),
  );
  console.log(chalk.gray("  2. Admin API access token\n"));

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "shopUrl",
      message: "Enter your Shopify store URL:",
      validate: validateUrl,
      default: config.get("SHOPIFY_SHOP_URL"),
    },
    {
      type: "password",
      name: "accessToken",
      message: "Enter your Admin API access token:",
      validate: validateRequired,
      default: config.get("SHOPIFY_ACCESS_TOKEN"),
    },
  ]);

  console.log(chalk.yellow("\n⏳ Testing connection..."));

  process.env.SHOPIFY_SHOP_URL = answers.shopUrl;
  process.env.SHOPIFY_ACCESS_TOKEN = answers.accessToken;

  const shopify = new ShopifyPlugin();

  try {
    await shopify.getProducts(1);
    console.log(chalk.green("✅ Successfully connected to Shopify!\n"));
    config.set("SHOPIFY_SHOP_URL", answers.shopUrl);
    config.set("SHOPIFY_ACCESS_TOKEN", answers.accessToken);
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ Connection failed: ${error.message}`));
    console.log(chalk.yellow("\n⚠️  Saving credentials anyway.\n"));
    config.set("SHOPIFY_SHOP_URL", answers.shopUrl);
    config.set("SHOPIFY_ACCESS_TOKEN", answers.accessToken);
    return false;
  }
}

async function setupAmazon() {
  console.log(chalk.blue("\n📦 Amazon SP-API Setup\n"));

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "sellerId",
      message: "Enter your Seller ID:",
      validate: validateRequired,
      default: config.get("AMAZON_SELLER_ID"),
    },
    {
      type: "input",
      name: "accessKeyId",
      message: "Enter your AWS Access Key ID:",
      validate: validateRequired,
      default: config.get("AMAZON_ACCESS_KEY_ID"),
    },
    {
      type: "password",
      name: "secretAccessKey",
      message: "Enter your AWS Secret Access Key:",
      validate: validateRequired,
      default: config.get("AMAZON_SECRET_ACCESS_KEY"),
    },
    {
      type: "input",
      name: "region",
      message: "Enter your region:",
      default: config.get("AMAZON_REGION") || "us-east-1",
    },
  ]);

  config.set("AMAZON_SELLER_ID", answers.sellerId);
  config.set("AMAZON_ACCESS_KEY_ID", answers.accessKeyId);
  config.set("AMAZON_SECRET_ACCESS_KEY", answers.secretAccessKey);
  config.set("AMAZON_REGION", answers.region);
  console.log(chalk.green("\n✅ Amazon credentials saved!\n"));
  return true;
}

async function setupFedEx() {
  console.log(chalk.blue("\n📦 FedEx Setup\n"));

  const answers = await inquirer.prompt([
    {
      type: "password",
      name: "apiKey",
      message: "Enter your FedEx API Key:",
      validate: validateRequired,
      default: config.get("FEDEX_API_KEY"),
    },
    {
      type: "password",
      name: "secretKey",
      message: "Enter your FedEx Secret Key:",
      validate: validateRequired,
      default: config.get("FEDEX_SECRET_KEY"),
    },
    {
      type: "input",
      name: "accountNumber",
      message: "Enter your FedEx Account Number:",
      validate: validateRequired,
      default: config.get("FEDEX_ACCOUNT_NUMBER"),
    },
  ]);

  config.set("FEDEX_API_KEY", answers.apiKey);
  config.set("FEDEX_SECRET_KEY", answers.secretKey);
  config.set("FEDEX_ACCOUNT_NUMBER", answers.accountNumber);
  console.log(chalk.green("\n✅ FedEx credentials saved!\n"));
  return true;
}

async function setupQuickBooks() {
  console.log(chalk.blue("\n📦 QuickBooks Setup\n"));

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "clientId",
      message: "Enter your Client ID:",
      validate: validateRequired,
      default: config.get("QUICKBOOKS_CLIENT_ID"),
    },
    {
      type: "password",
      name: "clientSecret",
      message: "Enter your Client Secret:",
      validate: validateRequired,
      default: config.get("QUICKBOOKS_CLIENT_SECRET"),
    },
    {
      type: "input",
      name: "realmId",
      message: "Enter your Realm ID:",
      validate: validateRequired,
      default: config.get("QUICKBOOKS_REALM_ID"),
    },
  ]);

  config.set("QUICKBOOKS_CLIENT_ID", answers.clientId);
  config.set("QUICKBOOKS_CLIENT_SECRET", answers.clientSecret);
  config.set("QUICKBOOKS_REALM_ID", answers.realmId);
  console.log(chalk.green("\n✅ QuickBooks credentials saved!\n"));
  return true;
}

async function main() {
  showBanner();

  const configured = getConfiguredPlatforms();
  if (configured.length > 0) {
    console.log(
      chalk.green("✓ Already configured:"),
      configured.join(", "),
      "\n",
    );
  }

  const { platforms } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "platforms",
      message: "Select platforms to configure:",
      choices: [
        {
          name: "Shopify",
          value: "shopify",
          checked: !configured.includes("Shopify"),
        },
        {
          name: "Amazon SP-API",
          value: "amazon",
          checked: !configured.includes("Amazon"),
        },
        {
          name: "FedEx",
          value: "fedex",
          checked: !configured.includes("FedEx"),
        },
        {
          name: "QuickBooks",
          value: "quickbooks",
          checked: !configured.includes("QuickBooks"),
        },
      ],
    },
  ]);

  if (platforms.length === 0) {
    console.log(chalk.yellow("\n⚠️  No platforms selected. Exiting...\n"));
    return;
  }

  for (const platform of platforms) {
    if (platform === "shopify") await setupShopify();
    if (platform === "amazon") await setupAmazon();
    if (platform === "fedex") await setupFedEx();
    if (platform === "quickbooks") await setupQuickBooks();
  }

  console.log(
    chalk.cyan.bold("\n╔════════════════════════════════════════════╗"),
  );
  console.log(chalk.cyan.bold("║            Setup Complete! 🎉             ║"));
  console.log(
    chalk.cyan.bold("╚════════════════════════════════════════════╝\n"),
  );

  const finalConfigured = getConfiguredPlatforms();
  console.log(chalk.green("Configured platforms:"), finalConfigured.join(", "));
  console.log(
    chalk.gray("\nConfiguration saved to:"),
    path.resolve(process.cwd(), ".env"),
  );

  console.log(chalk.blue("\n📚 Next steps:"));
  console.log(chalk.gray("  1. Start the server: ") + chalk.white("npm start"));
  console.log(chalk.gray("  2. Check the documentation for usage examples\n"));
}

main().catch((error) => {
  console.error(chalk.red("Setup failed:"), error.message);
  process.exit(1);
});
