import { Request, Response } from 'express';

import db from '../database/connections';
import convertHourToMinutes from '../utils/convertHourToMinutes';

interface ScheduleItemProps {
  week_day: number;
  from: string;
  to: string;
}

export default class ClassesControler {
  async index(req: Request, res: Response) {
    const filters = req.query;

    const subject = filters.subject as string;
    const week_day = filters.week_day as string;
    const time = filters.time as string;

    if (!filters.week_day || !filters.subject || !filters.time) {
      return res.status(400).json({
        error: 'Missing filters to search classes'
      })
    }

    const timeInMinutes = convertHourToMinutes(time);

    const classes = await db('classes')
      .whereExists(function() {
        this.select('class_schedule.*')
        .from('class_schedule')
        .whereRaw('`class_schedule`.`class_id` = `classes`.`id`')
        .whereRaw('`class_schedule`.`week_day` = ??', [Number(week_day)])
        .whereRaw('`class_schedule`.`from` <= ??', [timeInMinutes])
        .whereRaw('`class_schedule`.`to` > ??', [timeInMinutes])
        })
      .where('classes.subject', '=', subject)
      .join('users', 'classes.user_id', '=', 'users.id')
      .select(['classes.*', 'users.*']);

    return res.json(classes);
  }

  async create(req: Request, res: Response) {
    const { 
      name,
      avatar,
      whatsapp,
      bio,
      subject,
      cost,
      schedule
     } = req.body;
  
    const trx = await db.transaction();
  
    try {
      const users = {
        name,
        avatar,
        whatsapp,
        bio
      }
    
      const insertedUsersIds = await trx('users').insert(users);
    
      const classes = {
        subject,
        cost,
        user_id: insertedUsersIds[0],
      }
    
      const insertedClassesIds = await trx('classes').insert(classes);
    
      const classSchedule = schedule.map((scheduleItem: ScheduleItemProps) => {
        return {
          class_id: insertedClassesIds[0],
          week_day: scheduleItem.week_day,
          from: convertHourToMinutes(scheduleItem.from),
          to: convertHourToMinutes(scheduleItem.to)
        };
      })
    
      await trx('class_schedule').insert(classSchedule);
    
      await trx.commit();
    
      return res.status(201).json({ users, classes, classSchedule });
    } catch (err) {
      await trx.rollback();
  
      return res.status(400).json({
        error: 'Unexpected error while creating new class',
      })
    }
  }
}