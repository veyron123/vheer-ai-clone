import logger from '../utils/logger.js';
import EventEmitter from 'events';

/**
 * Queue Service for async job processing
 * In-memory implementation (can be replaced with Bull/RabbitMQ)
 */
class QueueService extends EventEmitter {
  constructor(name = 'default') {
    super();
    this.name = name;
    this.queue = [];
    this.processing = new Map();
    this.completed = new Map();
    this.failed = new Map();
    this.workers = [];
    this.isProcessing = false;
    this.concurrency = 2; // Number of parallel jobs
    
    logger.info(`Queue ${name} initialized`);
  }

  /**
   * Add job to queue
   * @param {string} type - Job type
   * @param {Object} data - Job data
   * @param {Object} options - Job options
   */
  async add(type, data, options = {}) {
    const job = {
      id: this.generateJobId(),
      type,
      data,
      options,
      status: 'waiting',
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      priority: options.priority || 0
    };

    // Add to queue based on priority
    if (job.priority > 0) {
      // Find position to insert
      const index = this.queue.findIndex(j => j.priority < job.priority);
      if (index === -1) {
        this.queue.push(job);
      } else {
        this.queue.splice(index, 0, job);
      }
    } else {
      this.queue.push(job);
    }

    logger.info('Job added to queue', {
      queue: this.name,
      jobId: job.id,
      type,
      priority: job.priority
    });

    this.emit('job:added', job);
    
    // Start processing if not already running
    this.startProcessing();

    return job;
  }

  /**
   * Process jobs in queue
   */
  async startProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0 || this.processing.size > 0) {
      // Process up to concurrency limit
      while (this.queue.length > 0 && this.processing.size < this.concurrency) {
        const job = this.queue.shift();
        this.processJob(job);
      }
      
      // Wait a bit before checking again
      await this.sleep(100);
    }
    
    this.isProcessing = false;
  }

  /**
   * Process individual job
   */
  async processJob(job) {
    try {
      job.status = 'processing';
      job.startedAt = new Date();
      this.processing.set(job.id, job);
      
      logger.info('Processing job', {
        queue: this.name,
        jobId: job.id,
        type: job.type
      });

      this.emit('job:processing', job);

      // Find worker for this job type
      const worker = this.workers.find(w => w.type === job.type);
      
      if (!worker) {
        throw new Error(`No worker registered for job type: ${job.type}`);
      }

      // Execute worker
      const result = await worker.handler(job);

      // Job completed successfully
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      
      this.processing.delete(job.id);
      this.completed.set(job.id, job);

      logger.info('Job completed', {
        queue: this.name,
        jobId: job.id,
        duration: job.completedAt - job.startedAt
      });

      this.emit('job:completed', job);

      return result;
    } catch (error) {
      job.attempts++;
      job.lastError = error.message;
      
      logger.error('Job failed', error, {
        queue: this.name,
        jobId: job.id,
        attempts: job.attempts
      });

      if (job.attempts < job.maxAttempts) {
        // Retry with exponential backoff
        const delay = Math.pow(2, job.attempts) * 1000;
        
        logger.info('Retrying job', {
          queue: this.name,
          jobId: job.id,
          attempt: job.attempts,
          delay
        });

        setTimeout(() => {
          this.processing.delete(job.id);
          this.queue.unshift(job); // Add back to front of queue
        }, delay);
      } else {
        // Job failed permanently
        job.status = 'failed';
        job.failedAt = new Date();
        
        this.processing.delete(job.id);
        this.failed.set(job.id, job);

        this.emit('job:failed', job);
      }
    }
  }

  /**
   * Register worker for job type
   * @param {string} type - Job type
   * @param {Function} handler - Job handler function
   */
  registerWorker(type, handler) {
    this.workers.push({ type, handler });
    
    logger.info('Worker registered', {
      queue: this.name,
      type
    });
  }

  /**
   * Get job by ID
   * @param {string} jobId - Job ID
   */
  getJob(jobId) {
    // Check in all states
    if (this.processing.has(jobId)) {
      return this.processing.get(jobId);
    }
    if (this.completed.has(jobId)) {
      return this.completed.get(jobId);
    }
    if (this.failed.has(jobId)) {
      return this.failed.get(jobId);
    }
    
    // Check in queue
    return this.queue.find(j => j.id === jobId);
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      name: this.name,
      waiting: this.queue.length,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
      total: this.queue.length + this.processing.size + this.completed.size + this.failed.size,
      isProcessing: this.isProcessing,
      concurrency: this.concurrency
    };
  }

  /**
   * Clear completed jobs
   */
  clearCompleted() {
    const count = this.completed.size;
    this.completed.clear();
    
    logger.info('Cleared completed jobs', {
      queue: this.name,
      count
    });
    
    return count;
  }

  /**
   * Clear failed jobs
   */
  clearFailed() {
    const count = this.failed.size;
    this.failed.clear();
    
    logger.info('Cleared failed jobs', {
      queue: this.name,
      count
    });
    
    return count;
  }

  /**
   * Retry failed job
   * @param {string} jobId - Job ID
   */
  retryJob(jobId) {
    const job = this.failed.get(jobId);
    
    if (!job) {
      throw new Error(`Failed job not found: ${jobId}`);
    }
    
    // Reset job
    job.attempts = 0;
    job.status = 'waiting';
    delete job.lastError;
    delete job.failedAt;
    
    // Remove from failed and add to queue
    this.failed.delete(jobId);
    this.queue.push(job);
    
    logger.info('Job retry scheduled', {
      queue: this.name,
      jobId
    });
    
    // Start processing
    this.startProcessing();
    
    return job;
  }

  /**
   * Set concurrency level
   * @param {number} concurrency - Number of parallel jobs
   */
  setConcurrency(concurrency) {
    this.concurrency = Math.max(1, concurrency);
    
    logger.info('Concurrency updated', {
      queue: this.name,
      concurrency: this.concurrency
    });
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Queue shutting down', { queue: this.name });
    
    // Stop accepting new jobs
    this.add = async () => {
      throw new Error('Queue is shutting down');
    };
    
    // Wait for current jobs to complete
    while (this.processing.size > 0) {
      await this.sleep(100);
    }
    
    logger.info('Queue shutdown complete', { queue: this.name });
  }
}

// Queue manager for multiple queues
class QueueManager {
  constructor() {
    this.queues = new Map();
  }

  /**
   * Get or create queue
   * @param {string} name - Queue name
   */
  getQueue(name = 'default') {
    if (!this.queues.has(name)) {
      this.queues.set(name, new QueueService(name));
    }
    return this.queues.get(name);
  }

  /**
   * Get all queues statistics
   */
  getAllStats() {
    const stats = {};
    for (const [name, queue] of this.queues) {
      stats[name] = queue.getStats();
    }
    return stats;
  }

  /**
   * Shutdown all queues
   */
  async shutdown() {
    const promises = [];
    for (const queue of this.queues.values()) {
      promises.push(queue.shutdown());
    }
    await Promise.all(promises);
  }
}

// Export singleton manager
const queueManager = new QueueManager();
export default queueManager;

// Also export QueueService class
export { QueueService };