import ControllerExtension from 'sap/ui/core/mvc/ControllerExtension';
import ExtensionAPI from 'sap/fe/templates/ObjectPage/ExtensionAPI';
import Context from 'sap/ui/model/odata/v4/Context';
import Dialog from 'sap/m/Dialog';

/**
 * @namespace sap.fe.cap.managetravels.ext.controller.ObjectPageExtension
 * @controller
 */
export default class ObjectPageExtension extends ControllerExtension<ExtensionAPI> {
	static readonly overrides = {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sap.fe.cap.managetravels.ext.controller.ObjectPageExtension
		 */
		onInit(this: ObjectPageExtension) {
			// you can access the Fiori elements extensionAPI via this.base.getExtensionAPI
			const model = this.base.getExtensionAPI().getModel();
		},
		editFlow: {
			onBeforeSave(this: ObjectPageExtension) {
				const context = this.base
					.getExtensionAPI()
					.getBindingContext() as Context;
				if (!context.getProperty("GoGreen")) {
					//void intentionally discards returned floating promise
					return new Promise<null>((resolve, reject) => { void this.openDialog(resolve, reject, context); })
				}
			},
		},
	};

	private async openDialog(resolve: (value: null) => void, reject: (reason?: unknown) => void, initialBindingContext: Context): Promise<void> {
		//try catch ensures errors in floating promises are handled properly
		try {
			const approveDialog = (await this.base.getExtensionAPI().loadFragment({
				contextPath: "",
				controller: {
					onConfirm() {
						approveDialog.close().destroy();
						resolve(null);
					},
					onCancel() {
						approveDialog.close().destroy();
						reject(null);
					}
				},
				id: "myFragment",
				initialBindingContext,
				name: "sap.fe.cap.managetravels.ext.fragment.Trees4Tickets"
			})) as Dialog;
			//consider dialog closing with ESC
			approveDialog.attachAfterClose(function () {
				approveDialog.destroy();
				reject(null);
			});			
			approveDialog.open();
		} catch (error) {
			reject(null);
		}
	}
}