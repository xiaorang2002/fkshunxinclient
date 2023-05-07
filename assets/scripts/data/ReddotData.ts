import { ListenerType } from './ListenerType';
import { MessageManager } from './../../framework/Manager/MessageManager';
import { ListenerManager } from './../../framework/Manager/ListenerManager';
import * as Proto from "../../proto/proto-min";

export class ReddotData {
    private _reddotInfoMap= new Map();


    constructor()
    {
        ListenerManager.getInstance().add(Proto.SC_RED_DOT.MsgID.ID, this, this.onRedDotRec);
    }

    updateReddotData()
    {
        MessageManager.getInstance().messageSend(Proto.CS_RED_DOT.MsgID.ID, {}); // 请求红点信息
    }

    private onRedDotRec(msg)
    {
        for (var i = 0; i < msg.redDots.length; i++)
            this._reddotInfoMap.set(msg.redDots[i].type, msg.redDots[i].count)
        MessageManager.getInstance().messagePost(ListenerType.reddotCountChanged);
        MessageManager.getInstance().disposeMsg();

    }

    getReddotByType(type)
    {
        return this._reddotInfoMap.get(type)
    }

}
