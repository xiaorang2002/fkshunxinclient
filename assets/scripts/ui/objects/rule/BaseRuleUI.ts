import { BaseUI } from "../../../../framework/UI/BaseUI";

const {ccclass, property} = cc._decorator;

@ccclass
export abstract class BaseRuleUI extends BaseUI 
{
    protected static className = "BaseRuleUI";
    protected isInit = true;

    abstract initRule(ruleInfo : any);
    abstract setRuleType(type : any);
    abstract getRule() : any;
    abstract updateView();
    abstract saveRule();
    abstract getCostInfo();

    onLoad() {
      
    }

    //规则按钮选择特效
    public ruleSelect(object : cc.Toggle, ischeck : boolean, isaction : boolean = true)
    {
        if (object == null)
            return;
        // let selectbg = object.node.getChildByName("sp_select_bg");
        let labeltitle = object.node.getChildByName("label_title");
        let outline = labeltitle.getComponent(cc.LabelOutline);
        if (ischeck)
        {
            // selectbg.active = true;
            let widthbg = labeltitle.width + 80;
            //需要动画

            if (!this.isInit && isaction)
            {
                // labeltitle.color = new cc.Color(246, 233, 221);
                // outline.enabled = true;
                // let times = 0;
                // let action0 = cc.callFunc(()=> {
                //     if (times == 3)
                //     {
                //         labeltitle.color = new cc.Color(119, 12, 18);
                //         outline.enabled = true;
                //     }
                //     selectbg.width = (widthbg / 5) * times;
                //     times += 1;
                // }, this);
                // let action1 = cc.delayTime(0.05);
                // object.node.runAction(cc.repeat(cc.sequence(action0,action1), 6));
            }
            else
            {
                // outline.enabled = true;
                // labeltitle.color = new cc.Color(246, 233, 221);
                // selectbg.width = widthbg;
            }
        }
        else
        {
            // selectbg.active = false;
            // outline.enabled = false;
            // labeltitle.color = new cc.Color(124, 110, 100);
        }
    }

    public setAllGrey()
    {
        
    }

}
