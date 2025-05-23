export interface FormFieldMappings {
    [fieldName: string]: string;
}

export interface FormConfig {
    formUrl: string;
    fieldMappings: FormFieldMappings;
} 