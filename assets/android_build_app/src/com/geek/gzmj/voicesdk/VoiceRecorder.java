package com.geek.gzmj.voicesdk;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.MediaRecorder;
import android.support.annotation.NonNull;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.widget.Toast;

import com.geek.gzmj.SDKAPI;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;



public class VoiceRecorder {

	private static MediaRecorder mRecorder;
	private static String mDirString;
	private static String mCurrentFilePathString;

	private static boolean isPrepared;// 是否准备好了
	private static String curfileNameString;

	/**
	 * 回调函数，准备完毕，准备好后，button才会开始显示录音框
	 * 
	 * @author nickming
	 *
	 */
	public interface AudioStageListener {
		void wellPrepared();
	}

	public static AudioStageListener mListener;

	public static void setOnAudioStageListener(AudioStageListener listener) {
		mListener = listener;
	}
	
	public static void setStorageDir(String fileDir){
		mDirString = fileDir;
	}
	
	public static String getStorageDir(){
		return mDirString;
	}

	public static void record_prepare()
	{
		VoiceRecorder.prepare(VoiceRecorder.curfileNameString);
	}

	 //准备方法
	public static void prepare(String fileNameString) {
		try {
			VoiceRecorder.curfileNameString = fileNameString;
			List<String> mPermissionList = new ArrayList<>();
			String[] permissions = new String[]{Manifest.permission.RECORD_AUDIO,
					Manifest.permission.READ_EXTERNAL_STORAGE,
					Manifest.permission.WRITE_EXTERNAL_STORAGE};
			//判断是否已经获取相应权限
			 mPermissionList.clear();//清空已经允许的没有通过的权限
			//逐个判断是否还有未通过的权限
			for (int i = 0;i<permissions.length;i++){
				if (ContextCompat.checkSelfPermission(SDKAPI.instance,permissions[i])!=
						PackageManager.PERMISSION_GRANTED){
					mPermissionList.add(permissions[i]);//添加还未授予的权限到mPermissionList中
				}
			}
			//申请权限
			if (mPermissionList.size()>0){//有权限没有通过，需要申请
				ActivityCompat.requestPermissions(SDKAPI.instance,permissions,100);
			}else {
			//if (ContextCompat.checkSelfPermission(SDKAPI.instance, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
				//相应操作
				// 一开始应该是false的
				isPrepared = false;

				File dir = new File(mDirString);
				if (!dir.exists()) {
					dir.mkdirs();
				}
				File file = new File(dir, fileNameString);

				mCurrentFilePathString = file.getAbsolutePath();

				mRecorder = new MediaRecorder();
				// 设置输出文件
				mRecorder.setOutputFile(file.getAbsolutePath());
				// 设置meidaRecorder的音频源是麦克风
				mRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
				mRecorder.setAudioEncodingBitRate(4750);
				// 设置文件音频的输出格式为amr
				mRecorder.setOutputFormat(MediaRecorder.OutputFormat.AMR_NB);
				// 设置音频的编码格式为amr
				mRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB);

				// 严格遵守google官方api给出的mediaRecorder的状态流程图
				mRecorder.prepare();

				mRecorder.start();
				// 准备结束
				isPrepared = true;
				// 已经准备好了，可以录制了
				if (mListener != null) {
					mListener.wellPrepared();
				}
			}
			// 若没有获得相应权限，则弹出对话框获取
//			else {                                                                                                        //申请权限
//					ActivityCompat.requestPermissions(SDKAPI.instance, new String[]{Manifest.permission.RECORD_AUDIO,
//							Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE }, 100);
//			}

		} catch (IllegalStateException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	/**
	 * 随机生成文件的名称
	 * 
	 * @return
	 */
	private static String generalFileName() {
		// TODO Auto-generated method stub

		return UUID.randomUUID().toString() + ".amr";
	}

	// 获得声音的level
	public static int getVoiceLevel(int maxLevel) {
		// mRecorder.getMaxAmplitude()这个是音频的振幅范围，值域是1-32767
		if (isPrepared && mRecorder!=null) {
			try {
				// 取证+1，否则去不到7
				return maxLevel * mRecorder.getMaxAmplitude() / 32768 + 1;
			} catch (Exception e) {
				// TODO Auto-generated catch block

			}
		}

		return 1;
	}

	// 释放资源
	public static void release() {
		// 严格按照api流程进行
		if(mRecorder != null){
			mRecorder.setOnErrorListener(null);
			try {
				mRecorder.stop();
			} catch (IllegalStateException e) {
				// TODO 如果当前java状态和jni里面的状态不一致，
				//e.printStackTrace();
				mRecorder = null;
				mRecorder = new MediaRecorder();
			}

			mRecorder.release();
			mRecorder = null;			
		}
	}

	// 取消,因为prepare时产生了一个文件，所以cancel方法应该要删除这个文件，
	// 这是与release的方法的区别
	public static void cancel() {
		release();
		if (mCurrentFilePathString != null) {
			File file = new File(mCurrentFilePathString);
			file.delete();
			mCurrentFilePathString = null;
		}

	}

	public static String getCurrentFilePath() {
		// TODO Auto-generated method stub
		return mCurrentFilePathString;
	}

}
