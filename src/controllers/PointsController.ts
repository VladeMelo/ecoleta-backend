import { Request, Response} from 'express';
import knexDB from '../database/connection';

import AppError from '../errors/AppError';

class PointsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const {city, uf, items} = request.query;

    const parsedItems = String(items).split(',').map(item => Number(item.trim()))

    const points = await knexDB('points')
      .join('point_items', 'points.id', '=', 'point_items.point_id')
      .whereIn('point_items.item_id', parsedItems) // que contém pelo menos um
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*'); // diferente do que houve no método show, ao fazer isso a prioridade volta pra points

    const serializedPoints = points.map(point => ({
      ...points,
      image_url: `http://localhost:3333/uploads/storage/${point.image}`,
    }));

    return response.json(serializedPoints);
  }

  public async show(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;

    const point = await knexDB('points').where('id', id).first();

    if (!point) {
      throw new AppError('Point not found');
    }

    const serializedPoint = {
      ...point,
      image_url: `http://localhost:3333/uploads/storage/${point.image}`
  };

    const items = await knexDB('items')
      .join('point_items', 'items.id', '=', 'point_items.item_id') // faz uma intersecção e retorna 'point_item' como sendo a "prioridade"
      .where('point_items.point_id', id) // por isso se utiliza 'point_items' aq
      .select('title');

    return response.json({ point: serializedPoint, items });
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items, // array de ids
    } = request.body;

    const trx = await knexDB.transaction(); // ex.: caso o segundo insert(o do point_items) falhe, quero que falhe o primeiro insert tb(o do points), mesmo se ele tiver passado

    const point = {
      image: request.file.filename,
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    };

    const insertedIds = await trx('points').insert(point); // retorna um array com o id de cada insert feito

    const point_id = insertedIds[0];

    const pointItems = items
      .split(',')
      .map((item: string) => Number(item.trim()))
      .map((item_id: number) => ({
        item_id,
        point_id,
      }));

    await trx('point_items').insert(pointItems);

    await trx.commit(); // para de fato fazer os inserts

    return response.send({
      point_id,
      ...point,
    });
  }
}

export default PointsController;
