
import { useState, useEffect } from 'react';
import { StrategyValidationService } from '@/services/strategyValidationService';

export const useStrategyValidation = (strategyCode: string) => {
  const [validation, setValidation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!strategyCode.trim()) {
      setValidation(null);
      return;
    }

    setIsValidating(true);
    
    // Debounce validation
    const timer = setTimeout(() => {
      const result = StrategyValidationService.validateStrategyCode(strategyCode);
      setValidation(result);
      setIsValidating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [strategyCode]);

  const validateResult = (result: any) => {
    return StrategyValidationService.validateStrategyResult(result);
  };

  const getTemplate = () => {
    return StrategyValidationService.getStrategyTemplate();
  };

  return {
    validation,
    isValidating,
    validateResult,
    getTemplate
  };
};
