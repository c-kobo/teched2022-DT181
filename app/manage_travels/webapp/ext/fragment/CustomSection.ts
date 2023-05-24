import UI5Event from 'sap/ui/base/Event';
import JSONModel from 'sap/ui/model/json/JSONModel';
import Popover from 'sap/m/Popover';
import Fragment from 'sap/ui/core/Fragment';

//add chart event parameter typings to our Macro Chart API?
interface paramType {
    data: object;
    target: object;
}

/**
 * Generated event handler.
 *
 * @param this reference to the 'this' that the event handler is bound to.
 * @param event the event object provided by the event provider
 */
export function onChartSelectionChanged(event: UI5Event) {
    if (event.getParameter("selected")) {
        //get element in the context of the custom section fragment
        const element = Fragment.byId("sap.fe.cap.managetravels::TravelObjectPage--fe::CustomSubSection::CustomSection", "myPopover");
        if (element instanceof Popover) {  
            let popupModel = element.getModel("popup") as JSONModel;
    
            if (!popupModel) {
                popupModel = new JSONModel();
                element.setModel(popupModel, "popup");
            }
            //Direct parameter access possible as chart is set to single selection mode
            const param = (event.getParameter("data") as [paramType])[0];
            popupModel.setData(param.data, true);
            // open popover at selected chart segment
            element.openBy(
                param.target as HTMLElement, true
            );
        }
    }
}