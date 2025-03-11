import {
  PluginCommonModule,
  Type,
  VendurePlugin,
  LanguageCode,
} from '@vendure/core'

import { ORDER_MERCHANT_NOTES_PLUGIN_OPTIONS } from './constants'
import { PluginInitOptions } from './types'

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [
    {
      provide: ORDER_MERCHANT_NOTES_PLUGIN_OPTIONS,
      useFactory: () => OrderMerchantNotesPlugin.options,
    },
  ],
  configuration: (config) => {
    // Plugin-specific configuration
    // such as custom fields, custom permissions,
    // strategies etc. can be configured here by
    // modifying the `config` object.

    config.customFields.Order.push({
      name: 'orderNotes',
      type: 'string',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Order Notes',
        },
      ],
      ui: {
        component: 'rich-text-form-input',
      },
    })

    config.customFields.Order.push({
      name: 'orderScheduleCollection',
      type: 'datetime',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Order Schedule',
        },
      ],
    })

    config.customFields.Order.push({
      name: 'merchantPublicId',
      type: 'string',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Merchant Public ID',
        },
      ],
    })

    return config
  },
  compatibility: '^3.0.0',
})
export class OrderMerchantNotesPlugin {
  static options: PluginInitOptions

  static init(options: PluginInitOptions): Type<OrderMerchantNotesPlugin> {
    this.options = options
    return OrderMerchantNotesPlugin
  }
}
