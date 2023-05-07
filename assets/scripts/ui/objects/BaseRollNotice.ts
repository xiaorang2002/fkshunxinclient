import { GameDataManager } from './../../../framework/Manager/GameDataManager';
import { BaseUI } from "../../../framework/UI/BaseUI";

const { ccclass, property } = cc._decorator;

@ccclass
export class BaseRollNotice extends BaseUI {

    protected static className = "BaseRollNotice";

    @property(cc.Label)
    labelContent: cc.Label = null;
    @property(cc.Integer)
    speed: number = 0;

    private globalRollNoticeList =  [] // 全局公告
    private whereNotice = 0
    private defaultNotice = ""
    onLoad() {
      
    }

    public startGlobalNotice(noticeList){
        this.globalRollNoticeList = noticeList;
        this.whereNotice = 1 // 1是全局公告
        this.onOneceFinished()
    }

    public onOneceFinished()
    {
        for (var idx = 0; idx<this.globalRollNoticeList.length; idx++)
        {
            if (this.globalRollNoticeList[idx].playCount > 0)
            {
                this.globalRollNoticeList[idx].playCount -= 1
                this.labelContent.string = this.globalRollNoticeList[idx].content;
                (<any>this.labelContent)._forceUpdateRenderData(true);
                this.initAction()
                return
            }
        }

        let systeminfo = GameDataManager.getInstance().systemData;
        if (systeminfo.globalNoticeList.length > 0)
        {
            systeminfo.globalNoticeList = []
            this.globalRollNoticeList = []
        }
        if (this.defaultNotice.length > 0)
        {
            this.updateInfo(this.defaultNotice)
            this.initAction()
1       }   
        else
        {
            this.node.parent.getChildByName("message_sprite").active = false
            this.node.parent.getChildByName("mask").active = false
        }
        // this.node.removeFromParent()
        // this.node.destroy()
    }

    public updateInfo(content: string, times = -1) {
        this.labelContent.string = content;
        (<any>this.labelContent)._forceUpdateRenderData(true); //由于改变string之后下一帧才会改变大小因此手动调用这个方法   
    }

    public setDefautNotice(content)
    {
        this.defaultNotice = content;
    }

    public initAction() {
        //非法速度检测
        if (this.speed <= 0)
            this.speed = 1;

        //加入滚动动画
        let len = this.labelContent.node.getContentSize().width;
        var maskWith = this.node.getContentSize().width
        // let winSizeW = cc.winSize.width
        var second = len / this.speed /2
        if(second < 10)
            second = 10
        let action_1 = cc.place(maskWith/2 + 50, 0);
        let action_2 = cc.moveTo(second, cc.v2(-len - maskWith, 0));
        this.labelContent.node.stopAllActions();
        if (this.whereNotice == 0)
        {
            let seq = cc.sequence(action_1, action_2);
            this.labelContent.node.runAction(cc.repeatForever(seq));
        }
        else
        {
            var action_3 = cc.callFunc(this.onOneceFinished.bind(this))
            let seq = cc.sequence(action_1, action_2, action_3);
            this.labelContent.node.runAction(seq)
        }
    }
}
