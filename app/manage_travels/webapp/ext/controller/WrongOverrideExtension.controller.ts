import ControllerExtension from 'sap/ui/core/mvc/ControllerExtension';
import ExtensionAPI from 'sap/fe/templates/ObjectPage/ExtensionAPI';
import MessageToast from 'sap/m/MessageToast';

/**
 * @namespace sap.fe.cap.managetravels.ext.controller.WrongOverrideExtension
 * @controller
 */
export default class WrongOverrideExtension extends ControllerExtension<ExtensionAPI> {
	//works if changed to static overrides
	static override = {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sap.fe.cap.managetravels.ext.controller.WrongOverrideExtension
		 */
		onInit(this: WrongOverrideExtension) {
			// you can access the Fiori elements extensionAPI via this.base.getExtensionAPI
			const model = this.base.getExtensionAPI().getModel();
		},
		editFlow: {
			onBeforeEdit(this: WrongOverrideExtension) {
				MessageToast.show("EditFlow onBeforeEdit override hit");
			},
		}
	}
}