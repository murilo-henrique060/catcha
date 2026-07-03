'use server';


/**
 * Controller responsável pelos Intercâmbios/Trocas Globais.
 * Demonstra Herança e uso de métodos encapsulados da classe pai.
 */
import { ExchangeController } from "../core/ExchangeController";

const exchangeControllerInstance = new ExchangeController();

// Wrapper functions
export async function getCurrentExchange(profileId: string) {
  return exchangeControllerInstance.getCurrentExchange(profileId);
}
