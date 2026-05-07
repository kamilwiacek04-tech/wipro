import { navigation } from "@/constants/navigation";
import { RootState } from "@/store";
import { FormType } from "@/types/global";
import { dataSchema } from "@/validators/data";
import { dataSchema as shaftParametersSchema } from "@/validators/shaftParameters";
import { useSelector } from "react-redux";

const schemaMap = {
  data: dataSchema,
  shaftParameters: shaftParametersSchema,
  // finishesAndAccessories: finishesAndAccessoriesSchema,
} as const;

const useAccessToCurrentSite = (currentSite: string) => {
  const formState: FormType = useSelector((state: RootState) => state.form);

  const currentSiteIndex = navigation.steps.findIndex((e) => e === currentSite);

  let lastCorectSchema = 'data';

  for(let i = 0; i <= currentSiteIndex; i++){
        const step = navigation.steps[i] as keyof typeof schemaMap;
        const schema = schemaMap[step];
        const data = formState[step];

        if(schema) {
            const isValid = schema.isValidSync(data);
            if(!isValid) {
                lastCorectSchema = step;
                break;
            }
            lastCorectSchema = step;
        }
  }


  return { lastCorectSchema };
};

export default useAccessToCurrentSite;
