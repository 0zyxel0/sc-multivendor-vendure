import {
  PluginCommonModule,
  Type,
  VendurePlugin,
  LanguageCode,
} from '@vendure/core'

import { PRODUCT_ADDITIONAL_NOTES_PLUGIN_OPTIONS } from './constants'
import { PluginInitOptions } from './types'

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [
    {
      provide: PRODUCT_ADDITIONAL_NOTES_PLUGIN_OPTIONS,
      useFactory: () => ProductAdditionalNotesPlugin.options,
    },
  ],
  configuration: (config) => {
    // Plugin-specific configuration
    // such as custom fields, custom permissions,
    // strategies etc. can be configured here by
    // modifying the `config` object.
    config.customFields.Product.push({
      name: 'infoUrl',
      type: 'string',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Info URL',
        },
      ],
    })

    config.customFields.Product.push({
      name: 'productNotes',
      type: 'string',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Product Notes',
        },
      ],
      ui: {
        component: 'rich-text-form-input',
      },
    })

    config.customFields.Product.push({
      name: 'productDeliveryNotes',
      type: 'string',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Product Delivery Notes',
        },
      ],
      ui: {
        component: 'rich-text-form-input',
      },
    })

    config.customFields.Product.push({
      name: 'advanceOrderOnly',
      type: 'boolean',
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Advance Order Only',
        },
      ],
    })

    return config
  },
  compatibility: '^3.0.0',
})
export class ProductAdditionalNotesPlugin {
  static options: PluginInitOptions

  static init(options: PluginInitOptions): Type<ProductAdditionalNotesPlugin> {
    this.options = options
    return ProductAdditionalNotesPlugin
  }
}
