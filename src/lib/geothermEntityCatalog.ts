import imageCatalogData from "../data/geotherm-entities/image-catalog.json";
import pageActionsData from "../data/geotherm-entities/page-actions.json";
import productsData from "../data/geotherm-entities/products.json";
import servicesData from "../data/geotherm-entities/services.json";
import type { ImageAsset, KnowledgeEntity, PageAction } from "./geothermTypes";

export const geothermEntities = [...productsData, ...servicesData] as KnowledgeEntity[];
export const geothermImageCatalog = imageCatalogData as ImageAsset[];
export const geothermPageActions = pageActionsData as PageAction[];

export function getEntityById(id: string) {
  return geothermEntities.find((entity) => entity.id === id);
}

export function getImagesByIds(ids: string[]) {
  const wanted = new Set(ids);
  return geothermImageCatalog.filter((image) => wanted.has(image.id));
}

export function getActionsByIds(ids: string[]) {
  const wanted = new Set(ids);
  return geothermPageActions.filter((action) => wanted.has(action.id));
}
