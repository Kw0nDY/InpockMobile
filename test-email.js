// Resend API 테스트 스크립트
const testConfigAndEmail = async () => {
  // 1. 설정 확인
  console.log('=== 이메일 서비스 설정 확인 ===');
  try {
    const configResponse = await fetch('http://localhost:5000/test/email/config');
    const configResult = await configResponse.json();
    console.log('설정 상태:', JSON.stringify(configResult, null, 2));
  } catch (error) {
    console.error('설정 확인 오류:', error);
  }

  // 2. 이메일 발송 테스트  
  console.log('\n=== 이메일 발송 테스트 ===');
  try {
    const response = await fetch('http://localhost:5000/api/auth/send-email-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'demo@amusefit.com',
        purpose: 'reset_password'
      })
    });
    
    const result = await response.json();
    console.log('발송 결과:', result);
    console.log('상태 코드:', response.status);
  } catch (error) {
    console.error('발송 테스트 오류:', error);
  }
};

testConfigAndEmail();