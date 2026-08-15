
export type CharacterData = {
    name: string;
    realm: string;
    wowClass?: string | null;
}

export type TaskData = {
  id: number;
  character: CharacterData;
  title: string;
  description: string;
  tags: string[];
  deadline?: Date | null;
  lockoutType?: string;
  unlocksAt?: Date | null;
}