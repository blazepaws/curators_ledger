
export type TaskCharacterData = {
    name: string;
    realm: string;
    wowClass?: string | null;
}

export type TaskData = {
  id: number;
  character: TaskCharacterData;
  title: string;
  description: string;
  tags: string[];
  deadline?: Date | null;
  lockoutType?: string;
  unlocksAt?: Date | null;
}