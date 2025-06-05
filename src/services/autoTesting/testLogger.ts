
export class TestLogger {
  static logTestStart(strategyName: string, symbol: string, intervalSeconds: number) {
    console.log('🚀 ==============================================');
    console.log('🚀 STARTING AUTO STRATEGY TESTING');
    console.log('🚀 ==============================================');
    console.log(`📊 Strategy: ${strategyName}`);
    console.log(`📈 Symbol: ${symbol}`);
    console.log(`⏰ Testing every ${intervalSeconds} seconds`);
    console.log('🚀 ==============================================');
  }

  static logTestStop() {
    console.log('🛑 ==============================================');
    console.log('🛑 AUTO STRATEGY TESTING STOPPED');
    console.log('🛑 ==============================================');
  }
}
