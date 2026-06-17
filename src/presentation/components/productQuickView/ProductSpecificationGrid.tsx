import React from 'react';
import { Text, View } from 'react-native';
import LocationIcon from '../../../../assets/icons/location.svg';
import { ProductQuickViewData } from './productQuickViewTypes';
import { qvStyles } from './productQuickViewStyles';

interface Props {
  data: ProductQuickViewData;
}

const SpecCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={qvStyles.specCell}>
    <Text style={qvStyles.specLabel}>{label}</Text>
    <Text style={qvStyles.specValue}>{value}</Text>
  </View>
);

export const ProductSpecificationGrid: React.FC<Props> = ({ data }) => (
  <>
    <View style={qvStyles.section}>
      <View style={qvStyles.sectionHeadingRow}>
        <LocationIcon width={16} height={16} />
        <Text style={qvStyles.sectionHeading}>Location</Text>
      </View>
      <Text style={qvStyles.addressText}>{data.locationAddress}</Text>
    </View>

    {data.quickViewData.length > 0 ? (
      <View style={qvStyles.specGrid}>
        {data.quickViewData.map(field => (
          <SpecCell
            key={field.fieldKey || field.fieldTitle}
            label={field.fieldTitle}
            value={field.fieldValue}
          />
        ))}
      </View>
    ) : null}
  </>
);
