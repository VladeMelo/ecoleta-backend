import { Request, Response } from 'express';
import knexDB from '../database/connection';

class ItemsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const items = await knexDB('items').select('*'); // select tudo

    const serializedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      image_url: `http://localhost:3333/uploads/${item.image}`,
    }));

    return response.json(serializedItems);
  }
}

export default ItemsController;
