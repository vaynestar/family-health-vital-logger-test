/**
 * Blood Pressure Categories based on standard clinical guidelines (mmHg):
 * - Normal (正常): Systolic < 120 AND Diastolic < 80
 * - Elevated (偏高 / 正常高值): Systolic 120-129 AND Diastolic < 80
 * - Stage 1 High (1级高血压): Systolic 130-139 OR Diastolic 80-89
 * - Stage 2 High (2级高血压): Systolic >= 140 OR Diastolic >= 90
 */

export function getBPCategory(systolic, diastolic) {
  const sys = Number(systolic);
  const dia = Number(diastolic);

  if (!sys || !dia) {
    return {
      label: '未测定',
      level: 'unknown',
      color: 'bg-slate-700 text-slate-300 border-slate-600',
      badgeColor: 'bg-slate-800 text-slate-300',
      textColor: 'text-slate-400',
      dotColor: 'bg-slate-400',
      advice: '请输入有效的收缩压和舒张压数值。'
    };
  }

  if (sys >= 140 || dia >= 90) {
    return {
      label: '2级高血压 (严重)',
      level: 'high2',
      color: 'bg-rose-950/80 text-rose-200 border-rose-600',
      badgeColor: 'bg-rose-600 text-white',
      textColor: 'text-rose-400',
      dotColor: 'bg-rose-500',
      advice: '血压较高，请保持情绪平稳，必要时咨询医师或按医嘱服药。'
    };
  }

  if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
    return {
      label: '1级高血压 (偏高)',
      level: 'high1',
      color: 'bg-amber-950/80 text-amber-200 border-amber-600',
      badgeColor: 'bg-amber-500 text-slate-950',
      textColor: 'text-amber-400',
      dotColor: 'bg-amber-500',
      advice: '血压略偏高，建议少盐低脂饮食，注意休息。'
    };
  }

  if (sys >= 120 && sys <= 129 && dia < 80) {
    return {
      label: '正常高值',
      level: 'elevated',
      color: 'bg-yellow-950/80 text-yellow-200 border-yellow-600',
      badgeColor: 'bg-yellow-500 text-slate-950',
      textColor: 'text-yellow-400',
      dotColor: 'bg-yellow-400',
      advice: '血压在正常高值范围，请继续保持良好作息。'
    };
  }

  return {
    label: '血压正常',
    level: 'normal',
    color: 'bg-emerald-950/80 text-emerald-200 border-emerald-600',
    badgeColor: 'bg-emerald-500 text-slate-950',
    textColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    advice: '指标非常理想，请继续保持健康的生活方式！'
  };
}
