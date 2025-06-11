
export const SIGNAL_PROCESSOR_PYTHON_CODE = `
def process_strategy_signals(result, reverse_signals=False):
    """Process and enhance strategy signals with proper directional logic"""
    
    print("🔧 Processing strategy signals...")
    
    # First validate and enforce directional signals
    result = enforce_directional_signals(result)
    
    if result.get('error'):
        print(f"❌ Signal processing failed: {result['error']}")
        return result
    
    # Apply signal reversal if requested
    if reverse_signals:
        print("🔄 Applying signal reversal...")
        result = reverse_strategy_signals(result)
    
    # Final validation
    is_valid, message = validate_strategy_signals(result)
    
    if not is_valid:
        print(f"❌ Final validation failed: {message}")
        return {
            'entry': [],
            'exit': [],
            'direction': [],
            'error': f'Signal validation failed: {message}'
        }
    
    print(f"✅ {message}")
    return result

def enhance_signal_confidence(result):
    """Add confidence scoring to signals"""
    
    entry = result.get('entry', [])
    direction = result.get('direction', [])
    
    if not entry or not direction:
        return result
    
    # Calculate confidence based on signal consistency
    confidence_scores = []
    
    for i in range(len(entry)):
        if entry[i] and direction[i]:
            # Base confidence
            confidence = 0.7
            
            # Boost confidence for consecutive signals in same direction
            if i > 0 and direction[i-1] == direction[i]:
                confidence += 0.1
            
            # Boost confidence if we have technical indicators
            if result.get('rsi') and i < len(result['rsi']):
                rsi_val = result['rsi'][i]
                if direction[i] == 'BUY' and rsi_val < 30:
                    confidence += 0.15
                elif direction[i] == 'SELL' and rsi_val > 70:
                    confidence += 0.15
            
            confidence_scores.append(min(confidence, 1.0))
        else:
            confidence_scores.append(0.0)
    
    result['confidence'] = confidence_scores
    return result
`;
