import express, {Request, Response, NextFunction} from 'express';
import path from 'path';
import 'express-async-errors'; // pois o express ainda nâo aceita promises
import cors from 'cors';
import { errors } from 'celebrate';

import routes from './routes';

import AppError from './errors/AppError';

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);

app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.use(errors());

app.use(
  (err: Error, request: Request, response: Response, next: NextFunction) => {
    if (err instanceof AppError) {
      return response.status(err.statusCode).json({
        status: 'error',
        message: err.message,
      });
    }

    return response.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  },
);

app.listen(process.env.PORT || 3000, () => {
  console.log('Server online');
});
