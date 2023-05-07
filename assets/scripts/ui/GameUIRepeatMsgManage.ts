import { StringData } from './../data/StringData';
import { GameManager } from './../GameManager';
import { MessageManager } from './../../framework/Manager/MessageManager';

// 用戏中的某些消息不能频繁点击发送
export class GameUIRepeatMsgManage {

    private static instance: GameUIRepeatMsgManage;
    public static getInstance(): GameUIRepeatMsgManage {
        if (this.instance == null)
            this.instance = new GameUIRepeatMsgManage();

        return this.instance;
    }

    private repeatMsgLimitMap = new Map() // 消息id对应过期时间
    private limitTime = 1


    updateMsgTime(dt)
    {
        if (this.repeatMsgLimitMap.size == 0)
            return;
        this.repeatMsgLimitMap.forEach((time, msgId)=>{
            if(time > 0)
            {
                time -= dt
                this.repeatMsgLimitMap.set(msgId, time)
            }
        })
    }

    private addRepeatLimitMsg(msgId, time)
    {
        this.repeatMsgLimitMap.set(msgId, time)
    }

    clearMsgLimitMap()
    {
        this.repeatMsgLimitMap.clear()
    }

    messageSendBeforeCheck(msgId, msg)
    {
        if (this.repeatMsgLimitMap.get(msgId) && this.repeatMsgLimitMap.get(msgId) > 0)
        {
            // GameManager.getInstance().openWeakTipsUI("请求已发送，请稍后") // 操作频繁
        }
        else
        {
            this.addRepeatLimitMsg(msgId, this.limitTime)
            MessageManager.getInstance().messageSend(msgId, msg);
        }
    }


}