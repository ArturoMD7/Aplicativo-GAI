export interface LogListado {
  id: number;
  user_name: string;
  username: string;
  action: string;
  action_display: string;
  endpoint: string;
  method: string;
  description: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  investigacion: number | null;
  investigacion_numero: number | null;
  user_profile_ficha: number | null;
  computer_name: string;
}
