import {
  OrderProcess,
  OrderState,
  PluginCommonModule,
  Type,
  VendurePlugin,
  LanguageCode,
} from '@vendure/core'

import { ORDER_INVENTORY_APPROVAL_PLUGIN_OPTIONS } from './constants'
import { PluginInitOptions } from './types'

declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomOrderFields {
      supplierApproval: 'Approved' | 'Pending' | 'Rejected';
    }
}


export const customOrderProcess: OrderProcess<'AwaitingApproval'> = {
  transitions: {
    AddingItems: {
      to: ['AwaitingApproval'],
      mergeStrategy: 'replace',
    },
    AwaitingApproval: {
      to: ['ArrangingPayment'], // Only allow proceeding if approved
    },
  },
}

export const customOrderValidationProcess: OrderProcess<OrderState> = {
  onTransitionStart(fromState, toState, data){
    if(toState === 'ArrangingPayment' && data.order?.customFields.supplierApproval === 'Rejected'){
      return 'Order Cannot be Ordered at this time. Please try with a different product or contact the Sales Department sales@scribblecubes.ph';
    }

  }
}

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [
    {
      provide: ORDER_INVENTORY_APPROVAL_PLUGIN_OPTIONS,
      useFactory: () => OrderInventoryApprovalPlugin.options,
    },
  ],
  configuration: (config) => {
    // Plugin-specific configuration
    // such as custom fields, custom permissions,
    // strategies etc. can be configured here by
    // modifying the `config` object.

    config.customFields.Order.push({
      name: 'supplierApproval',
      type: 'string',
      options: [
        { value: 'Approved' },
        { value: 'Pending' },
        { value: 'Rejected' },
      ],
      label: [
        {
          languageCode: LanguageCode.en,
          value: 'Supplier Approval',
        },
      ],
      defaultValue: 'Pending'
    })

    return config
  },
  compatibility: '^3.0.0',
})
export class OrderInventoryApprovalPlugin {
  static options: PluginInitOptions

  static init(options: PluginInitOptions): Type<OrderInventoryApprovalPlugin> {
    this.options = options
    return OrderInventoryApprovalPlugin
  }
}
