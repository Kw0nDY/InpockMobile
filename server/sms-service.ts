// 실제 SMS 발송 서비스 통합

interface SmsApiResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

// NHN Cloud SMS API 사용 (한국 대표 SMS 서비스)
async function sendSmsViaNhnCloud(phone: string, message: string): Promise<SmsApiResponse> {
  try {
    // NHN Cloud SMS API 호출
    const response = await fetch('https://api-sms.cloud.toast.com/sms/v3.0/appKeys/{appKey}/sender/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Secret-Key': process.env.NHN_SMS_SECRET_KEY || ''
      },
      body: JSON.stringify({
        body: message,
        sendNo: process.env.SMS_SENDER_NUMBER || '15448080',
        recipientList: [{ recipientNo: phone }],
        userId: 'amusefit-system'
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        message: 'SMS 발송 성공',
        messageId: result.header?.requestId
      };
    } else {
      throw new Error(`NHN Cloud SMS API 오류: ${response.status}`);
    }
  } catch (error) {
    console.error('NHN Cloud SMS 발송 실패:', error);
    return { success: false, message: 'NHN Cloud SMS 발송 실패' };
  }
}

// Twilio SMS API 사용 (국제적으로 널리 사용)
async function sendSmsViaTwilio(phone: string, message: string): Promise<SmsApiResponse> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    console.log('🔍 Twilio 설정 확인:');
    console.log(`Account SID: ${accountSid ? accountSid.substring(0, 10) + '...' : '미설정'}`);
    console.log(`Auth Token: ${authToken ? '설정됨' : '미설정'}`);
    console.log(`Phone Number: ${fromNumber || '미설정'}`);

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio 설정이 누락되었습니다. Account SID, Auth Token, Phone Number가 모두 필요합니다.');
    }

    // Account SID 형식 확인
    if (!accountSid.startsWith('AC')) {
      throw new Error(`Account SID는 'AC'로 시작해야 합니다. 현재: ${accountSid.substring(0, 5)}...`);
    }

    // 한국 전화번호 처리 - Twilio에서 구매한 한국 번호로 발송
    const toNumber = `+82${phone.substring(1)}`; // 수신번호: 한국 국가코드 추가
    console.log(`📱 SMS 발송 시도: ${phone} -> ${toNumber}`);

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: fromNumber, // 발신번호: Twilio에서 구매한 한국 번호
        To: toNumber,     // 수신번호: 사용자 휴대폰
        Body: message
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Twilio SMS 발송 성공: ${result.sid}`);
      return {
        success: true,
        message: 'Twilio SMS 발송 성공',
        messageId: result.sid
      };
    } else {
      console.error('❌ Twilio SMS API 오류:', result);
      throw new Error(`Twilio SMS API 오류: ${result.message} (코드: ${result.code})`);
    }
  } catch (error) {
    console.error('❌ Twilio SMS 발송 실패:', error);
    return { 
      success: false, 
      message: `Twilio SMS 발송 실패: ${error.message}` 
    };
  }
}

// 알리고 SMS API 사용 (한국 SMS 서비스)
async function sendSmsViaAligo(phone: string, message: string): Promise<SmsApiResponse> {
  try {
    const response = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        key: process.env.ALIGO_API_KEY || '',
        user_id: process.env.ALIGO_USER_ID || '',
        sender: process.env.ALIGO_SENDER_NUMBER || '',
        receiver: phone,
        msg: message,
        msg_type: 'SMS'
      })
    });

    const result = await response.json();
    
    if (result.result_code === '1') {
      return {
        success: true,
        message: 'SMS 발송 성공',
        messageId: result.msg_id
      };
    } else {
      throw new Error(`알리고 SMS API 오류: ${result.message}`);
    }
  } catch (error) {
    console.error('알리고 SMS 발송 실패:', error);
    return { success: false, message: '알리고 SMS 발송 실패' };
  }
}

// SMS 발송 메인 함수 (여러 서비스 자동 폴백)
export async function sendRealSms(phone: string, code: string, purpose: string): Promise<SmsApiResponse> {
  const purposeText = purpose === 'find_id' ? 'ID 찾기' : '비밀번호 재설정';
  const message = `[AmuseFit] ${purposeText} 인증번호: ${code} (10분간 유효)`;

  console.log(`📱 실제 SMS 발송 시도: ${phone}`);
  console.log(`메시지: ${message}`);

  // 1. NHN Cloud SMS 시도
  if (process.env.NHN_SMS_SECRET_KEY) {
    const nhnResult = await sendSmsViaNhnCloud(phone, message);
    if (nhnResult.success) {
      console.log(`✅ NHN Cloud SMS 발송 성공: ${phone}`);
      return nhnResult;
    }
    console.log(`❌ NHN Cloud SMS 실패: ${nhnResult.message}`);
  }

  // 2. Twilio SMS 시도
  if (process.env.TWILIO_ACCOUNT_SID) {
    const twilioResult = await sendSmsViaTwilio(phone, message);
    if (twilioResult.success) {
      console.log(`✅ Twilio SMS 발송 성공: ${phone}`);
      return twilioResult;
    }
    console.log(`❌ Twilio SMS 실패: ${twilioResult.message}`);
  }

  // 3. 알리고 SMS 시도
  if (process.env.ALIGO_API_KEY) {
    const aligoResult = await sendSmsViaAligo(phone, message);
    if (aligoResult.success) {
      console.log(`✅ 알리고 SMS 발송 성공: ${phone}`);
      return aligoResult;
    }
    console.log(`❌ 알리고 SMS 실패: ${aligoResult.message}`);
  }

  // 모든 실제 SMS 서비스 실패 시 개발 모드로 폴백
  console.log(`⚠️ 모든 SMS 서비스 실패 - 개발 모드로 폴백`);
  return { success: false, message: 'SMS 서비스 설정이 필요합니다' };
}

// SMS 서비스 설정 확인
export function checkSmsConfig(): { configured: boolean; services: string[] } {
  const services = [];
  
  if (process.env.NHN_SMS_SECRET_KEY) services.push('NHN Cloud SMS');
  if (process.env.TWILIO_ACCOUNT_SID) services.push('Twilio');
  if (process.env.ALIGO_API_KEY) services.push('알리고');

  return {
    configured: services.length > 0,
    services
  };
}