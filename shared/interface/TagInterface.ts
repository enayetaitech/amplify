/**
 * A plain-TS interface (no Mongoose stuff) that you can also reuse
 * on the frontend through your `shared/` folder if you like.
 */
export interface ITag {
  _id: string;
  title: string;
  color: string;             
  createdBy: string;
  projectId: string;
}
