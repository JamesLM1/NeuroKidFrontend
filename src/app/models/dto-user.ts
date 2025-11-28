export interface DTOUser {
    id?: number; // El ID es opcional al crear
    username: string;
    password?: string; // Hacemos la pass opcional, solo la enviamos al crear
    authorities: string;
}