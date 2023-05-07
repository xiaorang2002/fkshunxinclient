package com.geek.gzmj.wxapi;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import com.geek.gzmj.Constants;
import com.geek.gzmj.SDKAPI;
import com.tencent.mm.opensdk.modelbase.BaseReq;
import com.tencent.mm.opensdk.modelbase.BaseResp;
import com.tencent.mm.opensdk.modelmsg.SendAuth;
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.openapi.IWXAPIEventHandler;
import com.tencent.mm.opensdk.openapi.WXAPIFactory;

import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;
import org.json.JSONException;
import org.json.JSONObject;

public class WXEntryActivity extends Activity implements IWXAPIEventHandler {

    private IWXAPI _api;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        //setContentView(R.layout.plugin_entry);
        _api = WXAPIFactory.createWXAPI(this, Constants.APP_ID, false);
        _api.handleIntent(getIntent(), this);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

        setIntent(intent);
        _api.handleIntent(intent, this);
    }

    @Override
    public void onReq(BaseReq req) {
		/*
		switch (req.getType()) {
		case ConstantsAPI.COMMAND_GETMESSAGE_FROM_WX:
			//goToGetMsg();
			break;
		case ConstantsAPI.COMMAND_SHOWMESSAGE_FROM_WX:
			//goToShowMsg((ShowMessageFromWX.Req) req);
			break;
		default:
			break;
		}
		*/
        this.finish();
    }

    /**
     *  login and pay call back
     * @param resp
     */
    @Override
    public void onResp(BaseResp resp) {
        int result = 0;
        switch (resp.errCode) {
            case BaseResp.ErrCode.ERR_OK:
                if(SDKAPI.isLogin){
                    SendAuth.Resp authResp = (SendAuth.Resp)resp;
                    if(authResp != null && authResp.code != null){
                        String code = authResp.code;
//                    getAccess_token(code);
                        this.sendWxAuthMsg(resp.errCode,code);
                    }else{
                        if(authResp==null){
                            Toast.makeText(this, "authResp==null", Toast.LENGTH_LONG).show();
                        }
                        if(authResp.code==null){
                            Toast.makeText(this, "authResp.code==null", Toast.LENGTH_LONG).show();
                        }
                    }
                }
                break;
            case BaseResp.ErrCode.ERR_USER_CANCEL:
                result = 2;//R.string.errcode_cancel;
                break;
            case BaseResp.ErrCode.ERR_AUTH_DENIED:
                result = 3;//R.string.errcode_deny;
                break;
            default:
                result = 4;//R.string.errcode_unknown;
                break;
        }
        this.finish();
        if(resp.errCode!= BaseResp.ErrCode.ERR_OK && SDKAPI.isLogin){
            this.sendWxAuthMsg(resp.errCode,resp.errStr);
        }
        //Toast.makeText(this, result, Toast.LENGTH_LONG).show();
    }

    /**
     * 发送到客户端
     * @param errCode
     * @param code
     */
    private void sendWxAuthMsg(int errCode,String code){
        //{errorCode:1,data:xxx}
        JSONObject msg = new JSONObject();
        try {
            msg.put("errorCode",errCode);
            if(code!=null){
                msg.put("data",code);
            }
            this.sendMsg(msg.toString());
        } catch (JSONException e) {
            // 一定要在 GL 线程中执行
            msg = new JSONObject();
            try {
                msg.put("errorCode",-7);
                msg.put("data",e.getMessage());
            } catch (JSONException e1) {
                e1.printStackTrace();
            }
            this.sendMsg(msg.toString());
        }
    }

    private void sendMsg(final String msg){
        SDKAPI.instance.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                Cocos2dxJavascriptJavaBridge.evalString("window['sdkmanager'].onLoginResp("+ msg +")");
                Log.e("wx", "sendWxAuthMsg :" + msg);
            }
        });
    }
}