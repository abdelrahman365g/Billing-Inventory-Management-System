export interface Item {
  code: number;
  name: string;
  companyId: number;
  companyName: string;
  typeId: number;
  typeName: string;
  unitId: number;
  unitName: string;
  sellingPrice: number;
  buyingPrice: number;
}

export interface ItemInput {
  companyId: number;
  typeId: number;
  unitId: number;
  name: string;
  sellingPrice: number;
  buyingPrice: number;
}
