import { SetMetadata } from "@nestjs/common"

export const Is_PUBLIC_KEY ="IS_PUBLIC"
export const Public = ()=> SetMetadata(Is_PUBLIC_KEY,true)