import * as GameConstValue from "../../scripts/data/GameConstValue";
import { ListenerManager } from "../Manager/ListenerManager";
import { LogWrap } from "../Utils/LogWrap";

export interface UIClass<T extends BaseUI> {
    new(): T;
    getUrl(): string;
}

const { ccclass, property } = cc._decorator;

@ccclass
export abstract class BaseUI extends cc.Component {
    protected static className = "BaseUI";

    protected m_Tag: any;
    public get tag(): any {
        return this.m_Tag;
    }
    public set tag(value: any) {
        this.m_Tag = value;
    }

    public static getUrl(): string {
        return GameConstValue.ConstValue.UI_DIR + this.className;
    }

    protected onLoad(): void {
        this.showAnimation();
    }

    onDestroy(): void {
        ListenerManager.getInstance().removeAll(this);
        // //销毁监听
        // let ac1 = cc.spawn(cc.scaleTo(0.1, 0.2), cc.fadeOut(0.05));
        // this.node.runAction(cc.sequence(ac1, cc.callFunc(() => {
           
        // }, this)));
       
    }

    onShow(): void {
        
    }

    /**显示的动画 */
    protected showAnimation(): void {
        this.node.setScale(1);


        let seq = cc.sequence(cc.spawn(cc.scaleTo(0.1, 1.05), cc.fadeIn(0.1)), cc.scaleTo(0.05, 1) , cc.callFunc(() => {
            
        }, this));

        this.node.runAction(seq);
    }
}
