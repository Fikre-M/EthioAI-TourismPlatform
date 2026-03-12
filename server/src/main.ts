import app from './app';
import { config } from './config/index';

const PORT = config.server?.port || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${config.database ? 'development' : 'production'}`);
});
