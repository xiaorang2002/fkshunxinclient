package com.geek.gzmj;

import android.app.Activity;
import android.app.Service;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Vibrator;
import android.util.Log;

//微信
import com.tencent.mm.opensdk.modelmsg.SendMessageToWX;
import com.tencent.mm.opensdk.modelmsg.WXImageObject;
import com.tencent.mm.opensdk.modelmsg.WXMediaMessage;
import com.tencent.mm.opensdk.modelmsg.WXWebpageObject;
import com.tencent.mm.opensdk.modelpay.PayReq;
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.openapi.WXAPIFactory;

//闲聊
import org.cocos2dx.javascript.AppActivity;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;
import org.json.JSONObject;
import org.xianliao.im.sdk.api.ISGAPI;
import org.xianliao.im.sdk.api.SGAPIFactory;
import org.xianliao.im.sdk.constants.SGConstants;
import org.xianliao.im.sdk.modelmsg.SGImageObject;
import org.xianliao.im.sdk.modelmsg.SGLinkObject;
import org.xianliao.im.sdk.modelmsg.SGMediaMessage;
import org.xianliao.im.sdk.modelmsg.SGTextObject;
import org.xianliao.im.sdk.modelmsg.SendMessageToSG;

//吹牛
import com.android.sdklibrary.admin.SdkBuilder;
import com.android.sdklibrary.admin.SdkDirector;
import com.android.sdklibrary.admin.SdkImplBuilder;


import org.cocos2dx.lib.Cocos2dxActivity;


import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * SDK
 */
public class SDKAPI {
    //微信api对象
	public static IWXAPI api_wx;
    // 闲聊api对象
    public static ISGAPI api_xl;
    // 吹牛api对象
    public static SdkBuilder builder_cn;
    public static SdkDirector director_cn;

	public static Cocos2dxActivity instance;
	public static boolean isLogin = false;

	public static void Init(Cocos2dxActivity context){
		SDKAPI.instance = context;
		api_wx = WXAPIFactory.createWXAPI(context, Constants.APP_ID, true);
        api_wx.registerApp(Constants.APP_ID);

        api_xl = SGAPIFactory.createSGAPI(context, Constants.SG_APPID);


        builder_cn=new SdkImplBuilder();
        director_cn= SdkDirector.getInstance(instance, builder_cn);

        director_cn.setAppId(Constants.CN_APPID);
        director_cn.setAppSecret(Constants.CN_APP_SECRET);


	}

	private static String buildTransaction(final String type) {
	    return (type == null) ? String.valueOf(System.currentTimeMillis()) : type + System.currentTimeMillis();
	}

    /**微信登录
     *
     */
	public static void Login(){
		isLogin = true;
		final com.tencent.mm.opensdk.modelmsg.SendAuth.Req req = new com.tencent.mm.opensdk.modelmsg.SendAuth.Req();
		req.scope = "snsapi_userinfo";
		req.state = "carjob_wx_login";
        System.out.println(req);
		boolean ret = api_wx.sendReq(req);
		System.out.println(ret);

	}


    /**闲聊登录
     *
     */
	public static void Login_XL(){
        //可以检测闲聊是否已经安装
        if(!api_xl.isSGAppInstalled()){
//            Toast.makeText(instance,"闲聊应用未安装，请先安装闲聊应用",Toast.LENGTH_SHORT).show();
            SDKAPI.instance.runOnGLThread(new Runnable() {
                @Override
                public void run() {
                    Cocos2dxJavascriptJavaBridge.evalString("window['sdkmanager'].doSDKLog("+ 10060 +")");
                    Log.e("wx", "sendWxAuthMsg :" + 10060);
                }
            });
            return;
        }

        org.xianliao.im.sdk.modelmsg.SendAuth.Req req = new org.xianliao.im.sdk.modelmsg.SendAuth.Req();
        req.state = "none";
        api_xl.sendReq(req);
    }

    /**吹牛登录
     *
     */
    public static void Login_CN() {
        if(!director_cn.isInstallChuiNiu(instance)){
            SDKAPI.instance.runOnGLThread(new Runnable() {
                @Override
                public void run() {
                    Cocos2dxJavascriptJavaBridge.evalString("window['sdkmanager'].doSDKLog("+ 10061 +")");
                    Log.e("wx", "sendWxAuthMsg :" + 10061);
                }
            });
            return;
        }
        director_cn.cnAuthLogin(instance).
                setMyCallBack(new SdkDirector.MyCallBack() {
                    @Override
                    public void myBack(String accessToken, String openId, String refreshToken) {
                        JSONObject jsonObject = new JSONObject();
                        try{
                            jsonObject.put("accessToken",accessToken);
                            jsonObject.put("openId",openId);
                            jsonObject.put("refreshToken",refreshToken);
                            final String msg = String.format("window['sdkmanager'].onLoginRespCN(%s)",  jsonObject.toString());
                            Log.e("onLoginRespCN", "--------------------------------------:"+msg);

                            SDKAPI.instance.runOnGLThread(new Runnable() {
                                @Override
                                public void run() {
                                    Cocos2dxJavascriptJavaBridge.evalString(msg);
                                }
                            });
                        }catch (Exception e){
                            Log.d("onResp", "onResp: ."+e.getMessage());
                        }


                    }
                });
    }


    /**
     * 分享文字
     * @param url
     * @param title
     * @param desc
     * @param shareType "0" 是微信好友 "1" 微信朋友圈
     */
    public static void Share(String url,String title,String desc,String shareType, String filePath){
        try{
            isLogin = false;
            WXWebpageObject webpage = new WXWebpageObject();
            webpage.webpageUrl = url;
            WXMediaMessage msg = new WXMediaMessage(webpage);
            msg.title = title;
            msg.description = desc;
            Bitmap bmp = BitmapFactory.decodeFile(filePath);
            Bitmap thumbBmp=Bitmap.createScaledBitmap(bmp,108,108,true);
            msg.thumbData=Util.bitmap2Bytes(thumbBmp,32);// 设置缩略图
            //msg.thumbData = Util.bmpToByteArray(thumbBmp, true);

            SendMessageToWX.Req req = new SendMessageToWX.Req();
            req.transaction = buildTransaction("webpage");
            req.message = msg;
            if (shareType.equals("0")){
                req.scene = SendMessageToWX.Req.WXSceneSession;
            }else{
                req.scene = SendMessageToWX.Req.WXSceneTimeline;
            }

            api_wx.sendReq(req);
        }
        catch(Exception e){
            e.printStackTrace();
        }
    }


    /**
     * 分享文本到闲聊
     */
    public  static  void shareText_XL(String title, String contents) {
        //检测闲聊是否已经安装
        if(!api_xl.isSGAppInstalled()){
//            Toast.makeText(instance.getBaseContext(), "闲聊没有安装，请先安装闲聊", Toast.LENGTH_LONG).show();
            SDKAPI.instance.runOnGLThread(new Runnable() {
                @Override
                public void run() {
                    Cocos2dxJavascriptJavaBridge.evalString("window['sdkmanager'].doSDKLog("+ 10060 +")");
                    Log.e("wx", "sendWxAuthMsg :" + 10060);
                }
            });
            return;
        }
        //初始化一个SGTextObject对象，填写分享的文本内容
        SGTextObject textObject = new SGTextObject();
        textObject.text = contents;
        //用SGTextObject对象初始化一个SGMediaMessage对象
        SGMediaMessage msg = new SGMediaMessage();
        msg.mediaObject = textObject;
        msg.title = title;
        //构造一个Req
        SendMessageToSG.Req req = new SendMessageToSG.Req();
        req.transaction = SGConstants.T_TEXT;
        req.mediaMessage = msg;
        req.scene = SendMessageToSG.Req.SGSceneSession; //代表分享到会话列表
        //调用api接口发送数据到闲聊
        api_xl.sendReq(req);
    }

    /**
     * 图片分享
     * @param filePath
     * @param width
     * @param height
     * @param shareType
     */
    public  static  void ShareIMG(String filePath,int width,int height,String shareType){
        try{
            isLogin = false;
            WXImageObject imageObject = new WXImageObject();
//            imageObject.imagePath = filePath;
//            imageObject.imageData =
            File file = new File(filePath);
            FileInputStream inputStream = new FileInputStream(file);
            byte[] buff = new byte[(int) file.length()];
            inputStream.read(buff);
            inputStream.close();
            imageObject.imageData = buff;
            Log.e("xx--path",filePath);
            WXMediaMessage msg = new WXMediaMessage(imageObject);
            msg.mediaObject = imageObject;

            Bitmap bmp = BitmapFactory.decodeFile(filePath);
            Bitmap thumbBmp=Bitmap.createScaledBitmap(bmp,width,height,true);

            msg.thumbData=Util.bitmap2Bytes(thumbBmp,32);// 设置缩略图

            SendMessageToWX.Req req = new SendMessageToWX.Req();
            req.transaction = buildTransaction("image");
            req.message = msg;
            Log.e("xx","shareType:"+shareType);
            if (shareType.equals("0")){
                req.scene = SendMessageToWX.Req.WXSceneSession;
            }else{
                req.scene = SendMessageToWX.Req.WXSceneTimeline;
            }
            api_wx.sendReq(req);
            //instance.finish();
        }
        catch(Exception e){
            e.printStackTrace();
        }
    }


    /**
     * 分享图片到闲聊
     */
    public static void shareImage_XL(String filePath) {
        //检测闲聊是否已经安装
        if(!api_xl.isSGAppInstalled()){
            SDKAPI.instance.runOnGLThread(new Runnable() {
                @Override
                public void run() {
                    Cocos2dxJavascriptJavaBridge.evalString("window['sdkmanager'].doSDKLog("+ 10060 +")");
                    Log.e("wx", "sendWxAuthMsg :" + 10060);
                }
            });
            return;
        }

        Bitmap bmp = BitmapFactory.decodeFile(filePath);

        //初始化一个SGImageObject对象，设置所分享的图片内容
        SGImageObject imageObject = new SGImageObject(bmp);

        //用SGImageObject对象初始化一个SGMediaMessage对象
        SGMediaMessage msg = new SGMediaMessage();
        msg.mediaObject = imageObject;

        //构造一个Req
        SendMessageToSG.Req req = new SendMessageToSG.Req();
        req.transaction = SGConstants.T_IMAGE;
        req.mediaMessage = msg;
        req.scene = SendMessageToSG.Req.SGSceneSession; //代表分享到会话列表

        //调用api接口发送数据到闲聊
        api_xl.sendReq(req);
    }

    /**
     * 分享图片到吹牛
     */
    public static void shareImage_CN(String filePath) {
        if(!director_cn.isInstallChuiNiu(instance)){
//            Toast.makeText(instance, "吹牛没有安装，请先安装吹牛", Toast.LENGTH_LONG).show();
            SDKAPI.instance.runOnGLThread(new Runnable() {
                @Override
                public void run() {
                    Cocos2dxJavascriptJavaBridge.evalString("window['sdkmanager'].doSDKLog("+ 10061 +")");
                    Log.e("wx", "sendWxAuthMsg :" + 10061);
                }
            });
            return;
        }
        File file = new File(filePath);
        String content = "吹牛content";
        String title = "吹牛title";
        director_cn.shareImage(instance, SdkDirector.IMAGE, file, content, title, "");
        director_cn.setShareCallBack(new SdkDirector.ShareCallBack() {
            @Override
            public void myShareBack(String status, String message) {
                System.out.println(status);
            }
        });
    }

    /**
     * 分享链接到闲聊
     */
    public static void  shareLink_XL(String imagPath, String url, String title, String desc) {
        //检测闲聊是否已经安装
        if(!api_xl.isSGAppInstalled()){
//            Toast.makeText(instance, "闲聊没有安装，请先安装闲聊", Toast.LENGTH_LONG).show();
            SDKAPI.instance.runOnGLThread(new Runnable() {
                @Override
                public void run() {
                    Cocos2dxJavascriptJavaBridge.evalString("window['sdkmanager'].doSDKLog("+ 10060 +")");
                    Log.e("wx", "sendWxAuthMsg :" + 10061);
                }
            });
            return;
        }
        Bitmap bitmap = BitmapFactory.decodeFile(imagPath);
        Bitmap thumbImgNow = Bitmap.createScaledBitmap(bitmap,300,300, true);
        //初始化一个SGLinkObject对象，并设置一个分享图标
        SGLinkObject linkObject = new SGLinkObject(thumbImgNow);
        //要分享的链接，必填
        linkObject.shareUrl = url;

        //用SGImageObject对象初始化一个SGMediaMessage对象
        SGMediaMessage msg = new SGMediaMessage();
        msg.mediaObject = linkObject;
        msg.title = title;  //链接标题
        msg.description = desc;  //链接描述

        //构造一个Req
        SendMessageToSG.Req req = new SendMessageToSG.Req();
        req.transaction = SGConstants.T_LINK;
        req.mediaMessage = msg;
        req.scene = SendMessageToSG.Req.SGSceneSession; //代表分享到会话列表

        //调用api接口发送数据到闲聊
        api_xl.sendReq(req);
    }

    /**
     * 分享链接到吹牛
     */
    public static void shareLink_CN(String url, String title, String contents) {
        if(!director_cn.isInstallChuiNiu(instance)){
//            Toast.makeText(instance, "吹牛没有安装，请先安装吹牛", Toast.LENGTH_LONG).show();
            SDKAPI.instance.runOnGLThread(new Runnable() {
                @Override
                public void run() {
                    Cocos2dxJavascriptJavaBridge.evalString("window['sdkmanager'].doSDKLog("+ 10061 +")");
                    Log.e("wx", "sendWxAuthMsg :" + 10061);
                }
            });
            return;
        }
        final String backinfo = "roomNumber=4000";
        final String cnextra = "";
        director_cn.shareLink(instance, SdkDirector.LINK, url, "", contents, title, backinfo, cnextra);
        director_cn.setShareCallBack(new SdkDirector.ShareCallBack() {
            @Override
            public void myShareBack(String status, String message) {
                System.out.println(status);
//                Toast.makeText(instance, status, Toast.LENGTH_SHORT).show();
            }
        });
    }
    /**
     *  复制文字
     *  微信支付
     *  获取电量
     */
    public static void doAndroidCopyClipbordText(final String str){
        SDKAPI.instance.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                ClipboardManager cm = (ClipboardManager) SDKAPI.instance.getSystemService(Context.CLIPBOARD_SERVICE);
                cm.setText(str);
                Log.e("doCopyToClipboard", "doCopyToClipboard success");
            }
        });

    }

    /**
     * 获取电量 0.0-1.0
     * @return
     */
    public static float getAndroidBatteryLevel(){
        float tempLevel = 0;
        Intent intent = SDKAPI.instance.registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));

        int level = intent.getIntExtra("level", -1);
        int scale = intent.getIntExtra("scale", -1);
        if (level == -1 || scale == -1){
            tempLevel = 0.5f;
        }
        tempLevel = ((float)level / (float)scale) * 1.0f;
        //接受广播
        Log.i("获取电量", String.valueOf(tempLevel));
        return tempLevel;
    }

    /**
     * 微信支付
     * @param partnerId
     * @param prepayId
     * @param packageValue
     * @param nonceStr
     * @param timeStamp
     * @param sign
     */
    public  static void doWeiChatPay(final String partnerId,final String prepayId,final String packageValue,final String nonceStr,
                                     final String timeStamp,final String sign){
        SDKAPI.instance.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try{
                    PayReq req = new PayReq();
                    req.appId = Constants.APP_ID;
                    req.partnerId = partnerId;//商户号
                    req.prepayId = prepayId;//
                    req.packageValue = packageValue;//暂填写固定值Sign=WXPay
                    req.nonceStr = nonceStr;//随机字符串
                    req.timeStamp = timeStamp;//时间戳
                    req.sign = sign;//应用签名
                    api_wx.sendReq(req);
                }
                catch(Exception e){
                    e.printStackTrace();
                }
            }
        });

    }

    /** 获得网络类型
     *
     * @return
     */
    public static int GetNetType() {
        int netType = 0;
        ConnectivityManager connMgr = (ConnectivityManager) SDKAPI.instance.getContext()
                .getSystemService(SDKAPI.instance.getContext().CONNECTIVITY_SERVICE);
        NetworkInfo networkInfo = connMgr.getActiveNetworkInfo();
        if (networkInfo == null) {
            netType = -1;
        } else {
            int nType = networkInfo.getType();
            if (nType == ConnectivityManager.TYPE_MOBILE) {
                if (networkInfo.getExtraInfo().toLowerCase().equals("cmnet")) {
                    netType = 3;
                } else {
                    netType = 2;
                }
            } else if (nType == ConnectivityManager.TYPE_WIFI) {
                netType = 1;
            }
        }
        return netType;
    }

    /** 获得外网ip
     *
     * @return
     */
    public static String getNetIp() {
        URL infoUrl = null;
        InputStream inStream = null;
        String ipLine = "未知";
        HttpURLConnection httpConnection = null;
        try {
//            infoUrl = new URL("http://ip168.com/");
            infoUrl = new URL("http://pv.sohu.com/cityjson?ie=utf-8");
            URLConnection connection = infoUrl.openConnection();
            httpConnection = (HttpURLConnection) connection;
            int responseCode = httpConnection.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                inStream = httpConnection.getInputStream();
                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(inStream, "utf-8"));
                StringBuilder strber = new StringBuilder();
                String line = null;
                while ((line = reader.readLine()) != null){
                    strber.append(line + "\n");
                }
                Pattern pattern = Pattern
                        .compile("((?:(?:25[0-5]|2[0-4]\\d|((1\\d{2})|([1-9]?\\d)))\\.){3}(?:25[0-5]|2[0-4]\\d|((1\\d{2})|([1-9]?\\d))))");
                Matcher matcher = pattern.matcher(strber.toString());
                if (matcher.find()) {
                    ipLine = matcher.group();
                }
            }
        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                inStream.close();
                httpConnection.disconnect();
            } catch (IOException e) {
                e.printStackTrace();
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
        Log.e("getNetIp", ipLine);
        return ipLine;
    }

}
