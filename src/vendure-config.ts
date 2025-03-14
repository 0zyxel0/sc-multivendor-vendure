import {
  dummyPaymentHandler,
  DefaultJobQueuePlugin,
  DefaultSearchPlugin,
  VendureConfig,
} from '@vendure/core'
import {
  defaultEmailHandlers,
  EmailPlugin,
  FileBasedTemplateLoader,
} from '@vendure/email-plugin'
import { AssetServerPlugin } from '@vendure/asset-server-plugin'
import { AdminUiPlugin } from '@vendure/admin-ui-plugin'
import 'dotenv/config'
import path from 'path'
import { BullMQJobQueuePlugin } from '@vendure/job-queue-plugin/package/bullmq'
import { ProductAdditionalNotesPlugin } from './plugins/product-additional-notes/product-additional-notes.plugin'
import { OrderMerchantNotesPlugin } from './plugins/order-merchant-notes/order-merchant-notes.plugin'
import { DigitalProductsPlugin } from './plugins/digital-products/digital-products.plugin'
import { OrderInventoryApprovalPlugin } from './plugins/order-inventory-approval/order-inventory-approval.plugin'
import { StellatePlugin, defaultPurgeRules } from '@vendure/stellate-plugin'
import { MultivendorPlugin } from './plugins/multivendor-plugin/multivendor.plugin';

const IS_DEV = process.env.APP_ENV === 'dev'
const IS_ORDER_INVENTORY_APPROVAL_ENABLED =
  process.env.ENABLE_ORDER_INVENTORY_APPROVAL === 'true'
const serverPort = 3000

export const config: VendureConfig = {
  //@ts-ignore
  cors: {
    exposeHeaders: ['vendure-auth-token'],
  },
  apiOptions: {
    port: serverPort,
    adminApiPath: 'admin-api',
    shopApiPath: 'shop-api',
    // The following options are useful in development mode,
    // but are best turned off for production for security
    // reasons.
    ...(IS_DEV
      ? {
          adminApiPlayground: {
            settings: { 'request.credentials': 'include' },
          },
          adminApiDebug: true,
          shopApiPlayground: {
            settings: { 'request.credentials': 'include' },
          },
          shopApiDebug: true,
        }
      : {}),
  },
  authOptions: {
    tokenMethod: ['bearer', 'cookie'],
    superadminCredentials: {
      identifier: process.env.SUPERADMIN_USERNAME,
      password: process.env.SUPERADMIN_PASSWORD,
    },
    cookieOptions: {
      secret: process.env.COOKIE_SECRET,
    },
  },
  dbConnectionOptions: {
    type: 'postgres',
    // See the README.md "Migrations" section for an explanation of
    // the `synchronize` and `migrations` options.
    synchronize: true,
    migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
    logging: false,
    database: process.env.DB_NAME,
    schema: process.env.DB_SCHEMA,
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },
  paymentOptions: {
    paymentMethodHandlers: [dummyPaymentHandler],
  },
  // When adding or altering custom field definitions, the database will
  // need to be updated. See the "Migrations" section in README.md.
  customFields: {},
  plugins: [
    MultivendorPlugin.init({
      platformFeePercent: 10,
      platformFeeSKU: 'FEE',
    }),
    // DefaultJobQueuePlugin should be removed from the plugins array
    BullMQJobQueuePlugin.init({
      workerOptions: {
        removeOnComplete: {
          count: 500,
        },
        removeOnFail: {
          age: 60 * 60 * 24 * 7, // 7 days
          count: 1000,
        },
        concurrency: 3,
      },
      connection: {
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
        port: Number(process.env.REDIS_PORT),
      },
    }),
    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: path.join(__dirname, '../static/assets'),
      // For local dev, the correct value for assetUrlPrefix should
      // be guessed correctly, but for production it will usually need
      // to be set manually to match your production url.
      assetUrlPrefix: IS_DEV ? undefined : 'https://www.my-shop.com/assets/',
    }),
    DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
    EmailPlugin.init({
      devMode: true,
      outputPath: path.join(__dirname, '../static/email/test-emails'),
      route: 'mailbox',
      handlers: defaultEmailHandlers,
      templateLoader: new FileBasedTemplateLoader(
        path.join(__dirname, '../static/email/templates'),
      ),
      globalTemplateVars: {
        // The following variables will change depending on your storefront implementation.
        // Here we are assuming a storefront running at http://localhost:8080.
        fromAddress:
          '"Marketplace Notification" <no-reply-order-notification@scribblecubes.ph>',
        verifyEmailAddressUrl: 'https://marketplace.scribblecubes.ph/verify',
        passwordResetUrl: 'https://marketplace.scribblecubes.ph/password-reset',
        changeEmailAddressUrl:
          'https://marketplace.scribblecubes.ph/verify-email-address-change',
      },
    }),
    AdminUiPlugin.init({
      route: 'admin',
      port: 3002,
      adminUiConfig: {
        apiHost: process.env.FULL_VENDURE_HOST || 'http://localhost:3000',
        // Comment out the apiPort when you do not use the custom dns or localhost
        // apiPort: 443,
        adminApiPath: 'admin-api',
        hideVendureBranding: true,
        hideVersion: true,
      },
    }),
    // StellatePlugin.init({
    //   // The Stellate service name, i.e. `<serviceName>.stellate.sh`
    //   serviceName: 'my-service',
    //   // The API token for the Stellate Purging API. See the "pre-requisites" section above.
    //   apiToken: process.env.STELLATE_PURGE_API_TOKEN,
    //   devMode: !isProd || process.env.STELLATE_DEBUG_MODE ? true : false,
    //   debugLogging: process.env.STELLATE_DEBUG_MODE ? true : false,
    //   purgeRules: [
    //       ...defaultPurgeRules,
    //       // custom purge rules can be added here
    //   ],}),
    // Custom Plugins
    ProductAdditionalNotesPlugin.init({}),
    OrderMerchantNotesPlugin.init({}),
    DigitalProductsPlugin,
    // Conditionally add OrderInventoryApprovalPlugin
    ...(IS_ORDER_INVENTORY_APPROVAL_ENABLED
      ? [OrderInventoryApprovalPlugin.init({})]
      : []),
  ],
}
