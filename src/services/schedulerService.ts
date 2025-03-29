import config from '../config/config';
import optimizerService from './optimizerService';

/**
 * Сервис для планирования задач
 */
class SchedulerService {
  // Таймер для планировщика оптимизации
  private optimizationTimer: NodeJS.Timeout | null = null;
  
  /**
   * Запускает планировщик оптимизации изображений
   */
  public startOptimizationScheduler(): void {
    if (!config.optimizer.scheduledOptimization) {
      console.log('Плановая оптимизация изображений отключена в конфигурации');
      return;
    }
    
    console.log(`Планировщик оптимизации изображений запущен с расписанием: ${config.optimizer.optimizationSchedule}`);
    
    // Разбираем cron-строку (формат: минута час день месяц день_недели)
    const [minute, hour, dayOfMonth, month, dayOfWeek] = config.optimizer.optimizationSchedule.split(' ');
    
    // Проверяем время каждую минуту и запускаем задачу по расписанию
    this.optimizationTimer = setInterval(() => {
      const now = new Date();
      const currentMinute = now.getMinutes().toString();
      const currentHour = now.getHours().toString();
      const currentDayOfMonth = now.getDate().toString();
      const currentMonth = (now.getMonth() + 1).toString(); // Месяцы начинаются с 0
      const currentDayOfWeek = now.getDay().toString(); // 0 - воскресенье, 6 - суббота
      
      // Проверяем соответствие текущего времени расписанию
      const minuteMatch = minute === '*' || minute.split(',').includes(currentMinute);
      const hourMatch = hour === '*' || hour.split(',').includes(currentHour);
      const dayOfMonthMatch = dayOfMonth === '*' || dayOfMonth.split(',').includes(currentDayOfMonth);
      const monthMatch = month === '*' || month.split(',').includes(currentMonth);
      const dayOfWeekMatch = dayOfWeek === '*' || dayOfWeek.split(',').includes(currentDayOfWeek);
      
      if (minuteMatch && hourMatch && dayOfMonthMatch && monthMatch && dayOfWeekMatch) {
        console.log(`Запуск плановой оптимизации изображений: ${now.toLocaleString()}`);
        this.runOptimization();
      }
    }, 60000); // Проверяем каждую минуту
  }
  
  /**
   * Останавливает планировщик оптимизации изображений
   */
  public stopOptimizationScheduler(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
      console.log('Планировщик оптимизации изображений остановлен');
    }
  }
  
  /**
   * Запускает процесс оптимизации всех изображений
   */
  private async runOptimization(): Promise<void> {
    try {
      const stats = await optimizerService.optimizeDirectory();
      console.log(`Плановая оптимизация завершена. Обработано: ${stats.processed}, оптимизировано: ${stats.optimized}, ошибок: ${stats.errors}`);
    } catch (error) {
      console.error('Ошибка при плановой оптимизации изображений:', error);
    }
  }
}

export default new SchedulerService();
