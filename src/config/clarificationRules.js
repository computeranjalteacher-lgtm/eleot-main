/**
 * Deterministic Clarification Rules for ELEOT Scoring
 * These rules provide safety bounds and consistency checks after AI evaluation
 * 
 * Rules are applied AFTER AI scoring to ensure:
 * - Negative clarifications cap scores appropriately
 * - Positive clarifications set minimum floors
 * - Unknown/unclear answers don't inflate scores
 * - Only related criteria are affected
 */

// Map clarification question keys to their affected criteria
const CLARIFICATION_TO_CRITERIA = {
  'equal_access': ['A2'], // Environment A, Criterion 2
  'fair_treatment': ['A3'], // Environment A, Criterion 3
  'respect_empathy': ['A4'], // Environment A, Criterion 4
  'challenging_activities': ['B2'], // Environment B, Criterion 2
  'intellectual_risk': ['C1', 'C2'], // Environment C, Criteria 1 and 2
};

// Answer value mappings (normalized)
const ANSWER_MAPPINGS = {
  // Equal Access (A2)
  'نعم، متساو للجميع': 'yes_equal',
  'Yes, equal for all': 'yes_equal',
  'لا، غير متساو': 'no_unequal',
  'No, unequal': 'no_unequal',
  'غير واضح': 'unclear',
  'Unclear': 'unclear',
  
  // Fair Treatment (A3)
  'نعم، عادلة ومتسقة': 'yes_fair',
  'Yes, fair and consistent': 'yes_fair',
  'لا، غير متسقة': 'no_inconsistent',
  'No, inconsistent': 'no_inconsistent',
  
  // Respect & Empathy (A4)
  'نعم، كان هناك احترام واضح': 'yes_respect',
  'Yes, clear respect': 'yes_respect',
  'لا، لم يكن واضحاً': 'no_unclear',
  'No, not clear': 'no_unclear',
  
  // Challenging Activities (B2)
  'نعم، صعبة وقابلة للتحقيق': 'yes_challenging',
  'Yes, challenging and attainable': 'yes_challenging',
  'سهلة جداً': 'too_easy',
  'Too easy': 'too_easy',
  'صعبة جداً': 'too_difficult',
  'Too difficult': 'too_difficult',
  
  // Intellectual Risk (C1, C2)
  'نعم، كانوا يشعرون بالأمان': 'yes_safe',
  'Yes, they felt safe': 'yes_safe',
  'لا، لم يكونوا يشعرون بالأمان': 'no_unsafe',
  'No, they did not feel safe': 'no_unsafe',
};

/**
 * Clarification Rules Definition
 * Each rule defines min/max bounds based on answer value
 * 
 * Structure:
 * {
 *   criterionId: {
 *     answerValue: { min: number, max: number }
 *   }
 * }
 */
export const CLARIFICATION_RULES = {
  // A2 - Equal Access
  'A2': {
    'yes_equal': { min: 3 }, // If equal access confirmed, minimum score 3
    'no_unequal': { max: 2 }, // If unequal, maximum score 2
    'unclear': { max: 3 }, // If unclear, cap at 3
    'unknown': { max: 3 }, // If skipped/unknown, cap at 3
  },
  
  // A3 - Fair Treatment
  'A3': {
    'yes_fair': { min: 3 }, // If fair treatment confirmed, minimum score 3
    'no_inconsistent': { max: 2 }, // If inconsistent, maximum score 2
    'unclear': { max: 3 }, // If unclear, cap at 3
    'unknown': { max: 3 },
  },
  
  // A4 - Respect & Empathy
  'A4': {
    'yes_respect': { min: 3 }, // If respect confirmed, minimum score 3
    'no_unclear': { max: 2 }, // If not clear, maximum score 2
    'unclear': { max: 3 },
    'unknown': { max: 3 },
  },
  
  // B2 - Challenging Activities
  'B2': {
    'yes_challenging': { min: 3 }, // If challenging and attainable, minimum score 3
    'too_easy': { max: 2 }, // If too easy, maximum score 2
    'too_difficult': { max: 2 }, // If too difficult, maximum score 2
    'unclear': { max: 3 },
    'unknown': { max: 3 },
  },
  
  // C1 - Intellectual Risk (Sense of Community)
  'C1': {
    'yes_safe': { min: 3 }, // If students felt safe, minimum score 3
    'no_unsafe': { max: 2 }, // If students didn't feel safe, maximum score 2
    'unclear': { max: 3 },
    'unknown': { max: 3 },
  },
  
  // C2 - Intellectual Risk (Risk-taking)
  'C2': {
    'yes_safe': { min: 3 }, // If students felt safe, minimum score 3
    'no_unsafe': { max: 2 }, // If students didn't feel safe, maximum score 2
    'unclear': { max: 3 },
    'unknown': { max: 3 },
  },
};

/**
 * Normalize answer value to standard key
 */
export const normalizeAnswer = (answer) => {
  if (!answer) return 'unknown';
  return ANSWER_MAPPINGS[answer] || 'unknown';
};

/**
 * Get affected criteria for a clarification question
 */
export const getAffectedCriteria = (clarificationKey) => {
  return CLARIFICATION_TO_CRITERIA[clarificationKey] || [];
};

/**
 * Apply clarification rules to scores
 * 
 * @param {Object} scores - Current scores by criterion ID: { "A1": 4, "A2": 3, ... }
 * @param {Object} clarifications - Clarification answers: { "equal_access": "yes_equal", ... }
 * @param {Array} selectedEnvironments - Selected environment IDs: ["A", "B", ...]
 * @returns {Object} - { adjustedScores, adjustments }
 *   adjustedScores: Final scores after applying rules
 *   adjustments: Audit trail of changes: [{ criterionId, originalScore, adjustedScore, reason }]
 */
export const applyClarificationRules = (scores, clarifications, selectedEnvironments = []) => {
  const adjustedScores = { ...scores };
  const adjustments = [];
  
  // If no clarifications provided, return scores as-is
  if (!clarifications || Object.keys(clarifications).length === 0) {
    return { adjustedScores, adjustments };
  }
  
  // Process each clarification
  Object.entries(clarifications).forEach(([questionKey, answerValue]) => {
    // Normalize answer
    const normalizedAnswer = normalizeAnswer(answerValue);
    
    // Skip if answer is unknown (was skipped)
    if (normalizedAnswer === 'unknown') {
      return;
    }
    
    // Get affected criteria for this question
    const affectedCriteria = getAffectedCriteria(questionKey);
    
    // Apply rules to each affected criterion
    affectedCriteria.forEach(criterionId => {
      // Check if this criterion's environment is selected
      const envId = criterionId.charAt(0);
      if (selectedEnvironments.length > 0 && !selectedEnvironments.includes(envId)) {
        return; // Skip if environment not selected
      }
      
      // Get current score
      const currentScore = adjustedScores[criterionId];
      if (currentScore === undefined) {
        return; // Skip if criterion not evaluated
      }
      
      // Get rule for this criterion and answer
      const rule = CLARIFICATION_RULES[criterionId]?.[normalizedAnswer];
      if (!rule) {
        return; // No rule defined for this combination
      }
      
      // Apply rule (min/max bounds)
      let newScore = currentScore;
      let reason = '';
      
      if (rule.min !== undefined && currentScore < rule.min) {
        newScore = rule.min;
        reason = `Clarification "${questionKey}" (${normalizedAnswer}) sets minimum to ${rule.min}`;
      } else if (rule.max !== undefined && currentScore > rule.max) {
        newScore = rule.max;
        reason = `Clarification "${questionKey}" (${normalizedAnswer}) caps maximum to ${rule.max}`;
      }
      
      // Ensure score is within valid range (1-4)
      newScore = Math.max(1, Math.min(4, newScore));
      
      // Record adjustment if score changed
      if (newScore !== currentScore) {
        adjustedScores[criterionId] = newScore;
        adjustments.push({
          criterionId,
          originalScore: currentScore,
          adjustedScore: newScore,
          reason,
          clarificationKey: questionKey,
          answerValue: normalizedAnswer,
        });
      }
    });
  });
  
  return { adjustedScores, adjustments };
};

/**
 * Get human-readable explanation for an adjustment
 */
export const getAdjustmentExplanation = (adjustment, isRTL = true) => {
  const { criterionId, originalScore, adjustedScore, clarificationKey, answerValue } = adjustment;
  
  if (isRTL) {
    return `تم تعديل ${criterionId} من ${originalScore} إلى ${adjustedScore} بناءً على إجابة السؤال التوضيحي "${clarificationKey}" (${answerValue})`;
  } else {
    return `${criterionId} adjusted from ${originalScore} to ${adjustedScore} based on clarification "${clarificationKey}" (${answerValue})`;
  }
};

