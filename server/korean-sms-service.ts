// 한국 SMS 서비스 (전화번호 구매 없이 사용 가능)

interface KoreanSmsResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

// 알리고 SMS (한국 - 전화번호 구매 불필요)
async function sendSmsViaAligo(phone: string, message: string): Promise<KoreanSmsResponse> {
  try {
    if (!process.env.ALIGO_API_KEY || !process.env.ALIGO_USER_ID) {
      throw new Error('알리고 API 설정이 필요합니다');
    }

    const response = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        key: process.env.ALIGO_API_KEY,
        user_id: process.env.ALIGO_USER_ID,
        sender: process.env.ALIGO_SENDER_NUMBER || '15448080', // 기본 발신번호
        receiver: phone,
        msg: message,
        msg_type: 'SMS'
      })
    });

    const result = await response.json();
    
    if (result.result_code === '1') {
      console.log(`✅ 알리고 SMS 발송 성공: ${phone}`);
      return {
        success: true,
        message: '알리고 SMS 발송 성공',
        messageId: result.msg_id
      };
    } else {
      throw new Error(`알리고 SMS 오류: ${result.message}`);
    }
  } catch (error) {
    console.error('알리고 SMS 발송 실패:', error);
    return { 
      success: false, 
      message: `알리고 SMS 발송 실패: ${error.message}` 
    };
  }
}

// NHN Cloud SMS (한국 - 발신번호 등록 후 사용)
async function sendSmsViaNhnCloud(phone: string, message: string): Promise<KoreanSmsResponse> {
  try {
    if (!process.env.NHN_SMS_SECRET_KEY || !process.env.NHN_SMS_APP_KEY) {
      throw new Error('NHN Cloud SMS 설정이 필요합니다');
    }

    const response = await fetch(`https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${process.env.NHN_SMS_APP_KEY}/sender/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Secret-Key': process.env.NHN_SMS_SECRET_KEY
      },
      body: JSON.stringify({
        body: message,
        sendNo: process.env.NHN_SMS_SENDER_NUMBER || '15448080',
        recipientList: [{ recipientNo: phone }],
        userId: 'amusefit-system'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ NHN Cloud SMS 발송 성공: ${phone}`);
      return {
        success: true,
        message: 'NHN Cloud SMS 발송 성공',
        messageId: result.header?.requestId
      };
    } else {
      const error = await response.json();
      throw new Error(`NHN Cloud SMS 오류: ${error.header?.resultMessage}`);
    }
  } catch (error) {
    console.error('NHN Cloud SMS 발송 실패:', error);
    return { 
      success: false, 
      message: `NHN Cloud SMS 발송 실패: ${error.message}` 
    };
  }
}

// 한국 SMS 발송 메인 함수
export async function sendKoreanSms(phone: string, code: string, purpose: string): Promise<KoreanSmsResponse> {
  const purposeText = purpose === 'find_id' ? 'ID 찾기' : '비밀번호 재설정';
  const message = `[AmuseFit] ${purposeText} 인증번호: ${code} (10분간 유효)`;

  console.log(`📱 한국 SMS 발송 시도: ${phone}`);

  // 1. 알리고 SMS 시도 (전화번호 구매 불필요)
  if (process.env.ALIGO_API_KEY) {
    const aligoResult = await sendSmsViaAligo(phone, message);
    if (aligoResult.success) {
      return aligoResult;
    }
    console.log(`❌ 알리고 실패: ${aligoResult.message}`);
  }

  // 2. NHN Cloud SMS 시도
  if (process.env.NHN_SMS_SECRET_KEY) {
    const nhnResult = await sendSmsViaNhnCloud(phone, message);
    if (nhnResult.success) {
      return nhnResult;
    }
    console.log(`❌ NHN Cloud 실패: ${nhnResult.message}`);
  }

  return { 
    success: false, 
    message: '한국 SMS 서비스 설정이 필요합니다' 
  };
}

// 한국 SMS 서비스 설정 확인
export function checkKoreanSmsConfig(): { configured: boolean; services: string[] } {
  const services = [];
  
  if (process.env.ALIGO_API_KEY) services.push('알리고');
  if (process.env.NHN_SMS_SECRET_KEY) services.push('NHN Cloud SMS');

  return {
    configured: services.length > 0,
    services
  };
}